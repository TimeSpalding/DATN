output "public_ip" {
  description = "Fixed Public Elastic IP of the deployment server"
  value       = aws_eip.app_eip.public_ip
}

output "web_url" {
  description = "Direct Web URL to access the deployed frontend application"
  value       = "http://${aws_eip.app_eip.public_ip}/"
}

output "ssh_command" {
  description = "Command to SSH connect securely into the server"
  value       = "ssh -i terraform/deployer_key.pem ubuntu@${aws_eip.app_eip.public_ip}"
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.app_server.id
}
