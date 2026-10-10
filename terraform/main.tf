provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  default     = "ap-southeast-1"
  description = "AWS region to deploy resources (Singapore)"
}

variable "instance_type" {
  type        = string
  default     = "t3.large"
  description = "EC2 instance type (2 vCPU, 8GB RAM)"
}

variable "disk_size_gb" {
  type        = number
  default     = 40
  description = "EBS root volume size in GB (gp3)"
}

# 1. SSH Key Pair Generation
resource "tls_private_key" "deployer" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "deployer_private_key" {
  content         = tls_private_key.deployer.private_key_pem
  filename        = "${path.module}/deployer_key.pem"
  file_permission = "0400"
}

resource "aws_key_pair" "deployer" {
  key_name   = "visual-search-deployer-key"
  public_key = tls_private_key.deployer.public_key_openssh
}

# 2. Network & Security Group
data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "app_sg" {
  name        = "visual-search-app-sg"
  description = "Security group for visual search e-commerce platform"
  vpc_id      = data.aws_vpc.default.id

  # SSH access (port 22)
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Web HTTP (port 80)
  ingress {
    description = "Public HTTP web portal"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Web HTTPS (port 443)
  ingress {
    description = "Public HTTPS web portal"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # MinIO S3 API (port 9000 for image downloads)
  ingress {
    description = "MinIO S3 API for image downloads"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound access for package updates and container pulls
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name        = "visual-search-sg"
    Environment = "production"
    Project     = "DATN"
  }
}

# 3. Ubuntu 24.04 LTS AMI Data Lookup
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 4. EC2 Compute Instance
resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size           = var.disk_size_gb
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    delete_on_termination = true
    tags = {
      Name = "visual-search-root-ebs"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              set -ex

              # 1. Update OS packages
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release git unzip ufw

              # 2. Install official Docker Engine
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc

              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              systemctl enable --now docker
              usermod -aG docker ubuntu

              # 3. Create app workspace
              mkdir -p /home/ubuntu/app
              chown -R ubuntu:ubuntu /home/ubuntu/app

              # 4. Signal bootstrap completion
              echo "Bootstrap completed at $(date)" > /home/ubuntu/bootstrap_done.txt
              EOF

  tags = {
    Name        = "visual-search-ecommerce-server"
    Environment = "production"
    Project     = "DATN"
  }
}

# 5. Elastic IP Allocation
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "visual-search-elastic-ip"
  }
}
