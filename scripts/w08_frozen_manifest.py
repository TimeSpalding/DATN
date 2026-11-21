import csv
import hashlib
import json
import os
from PIL import Image

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MANIFEST_JSON = os.path.join(ROOT_DIR, "Evidence", "W08", "frozen_pairs_w08.json")
MANIFEST_CSV = os.path.join(ROOT_DIR, "Evidence", "W08", "frozen_pairs_w08.csv")

# Bo 20 cap co dinh chia thanh 4 nhom de danh gia Issue #19 va #20.
# Tat ca duong dan tinh tu thu muc goc du an va co SHA-256 kiem tra tinh toan ven.
FROZEN_PAIRS_SPEC = [
    # --- Nhom 1: standard (5 cap chuan, it che khuat, tu the thang) ---
    {
        "pair_id": "S01",
        "group": "standard",
        "category": "upper",
        "person_rel": "datacard/test_img/000164_0.jpg",
        "cloth_rel": "datacard/test_color/011363_1.jpg",
        "challenge_note": "Tu the thang co ban, doi ao so mi trang sang ao thun do tham dai tay",
    },
    {
        "pair_id": "S02",
        "group": "standard",
        "category": "upper",
        "person_rel": "datacard/test_img/000514_0.jpg",
        "cloth_rel": "datacard/test_color/000118_1.jpg",
        "challenge_note": "Tu the thang, doi ao phong trang sang ao dai tay cham bi xanh tim than",
    },
    {
        "pair_id": "S03",
        "group": "standard",
        "category": "upper",
        "person_rel": "datacard/test_img/000466_0.jpg",
        "cloth_rel": "datacard/test_color/000228_1.jpg",
        "challenge_note": "Tu the thang, doi ao xam sang ao xanh reu in hoa tiet mat ho",
    },
    {
        "pair_id": "S04",
        "group": "standard",
        "category": "upper",
        "person_rel": "datacard/test_img/000057_0.jpg",
        "cloth_rel": "datacard/test_color/018626_1.jpg",
        "challenge_note": "Tu the thang, doi ao sat nach sang ao polo do co be",
    },
    {
        "pair_id": "S05",
        "group": "standard",
        "category": "upper",
        "person_rel": "datacard/test_img/000395_0.jpg",
        "cloth_rel": "datacard/test_color/000370_1.jpg",
        "challenge_note": "Tu the thang, doi ao tron sang ao coc tay ke soc cam den",
    },
    # --- Nhom 2: mask_boundary (5 cap loi bien mat na, sot tay ao, trang-tren-trang) ---
    {
        "pair_id": "M01",
        "group": "mask_boundary",
        "category": "upper",
        "person_rel": "datacard/test_img/000320_0.jpg",
        "cloth_rel": "datacard/test_color/004702_1.jpg",
        "challenge_note": "Loi sot tay ao cu: nguoi mac ao dai tay do -> thu ao coc tay trang IAM SCARLETT",
    },
    {
        "pair_id": "M02",
        "group": "mask_boundary",
        "category": "upper",
        "person_rel": "datacard/test_img/000266_0.jpg",
        "cloth_rel": "datacard/test_color/000532_1.jpg",
        "challenge_note": "Loi tran mask qua eo: ao den + quan den tiep mau -> thu ao hoa tiet",
    },
    {
        "pair_id": "M03",
        "group": "mask_boundary",
        "category": "upper",
        "person_rel": "datacard/test_img/000339_0.jpg",
        "cloth_rel": "datacard/test_color/015158_1.jpg",
        "challenge_note": "Loi trang-tren-trang: ao dich mau trang tren nen trang + chu nho RIOT",
    },
    {
        "pair_id": "M04",
        "group": "mask_boundary",
        "category": "upper",
        "person_rel": "datacard/test_img/000001_0.jpg",
        "cloth_rel": "datacard/test_color/000048_1.jpg",
        "challenge_note": "Loi sot vong co tay den khi doi ao dai tay den sang ao coc tay vang",
    },
    {
        "pair_id": "M05",
        "group": "mask_boundary",
        "category": "upper",
        "person_rel": "image_person_with_bag/person_tiennd/person/p4.jpg",
        "cloth_rel": "image_person_with_bag/person_tiennd/clothe/c87.jpg",
        "challenge_note": "Vest toi mau + quan den tren nen toi + khoang tay che ngang eo",
    },
    # --- Nhom 3: occlusion (5 cap che khuat boi tui xach, day deo, coc nuoc, toc) ---
    {
        "pair_id": "O01",
        "group": "occlusion",
        "category": "upper",
        "person_rel": "image_person_with_bag/person_tiennd/person/p1.jpg",
        "cloth_rel": "image_person_with_bag/person/clothe/c202.jpg",
        "challenge_note": "Tui xach den cam truoc nguc + khoanh tay che vung than ao",
    },
    {
        "pair_id": "O02",
        "group": "occlusion",
        "category": "upper",
        "person_rel": "image_person_with_bag/person/person/p200.jpg",
        "cloth_rel": "image_person_with_bag/person_tiennd/clothe/c47.jpg",
        "challenge_note": "Toc dai phu vai phai + tay cam coc giay + tay gio cao",
    },
    {
        "pair_id": "O03",
        "group": "occlusion",
        "category": "upper",
        "person_rel": "image_person_with_bag/person/person/p201.jpg",
        "cloth_rel": "image_person_with_bag/person/clothe/c200.jpg",
        "challenge_note": "Day deo tui cheo qua nguc + tua lan can + tay cam coc",
    },
    {
        "pair_id": "O04",
        "group": "occlusion",
        "category": "upper",
        "person_rel": "image_person_with_bag/person/person/p202.jpeg",
        "cloth_rel": "image_person_with_bag/person/clothe/c201.jpg",
        "challenge_note": "Day deo tui cheo + tay cam ly tra sua lon + tay chong ma",
    },
    {
        "pair_id": "O05",
        "group": "occlusion",
        "category": "upper",
        "person_rel": "image_person_with_bag/person_tiennd/person/p5.jpg",
        "cloth_rel": "image_person_with_bag/person_tiennd/clothe/c44.jpg",
        "challenge_note": "Ao khoac long day + tui deo cheo truoc bung + hai tay dut tui",
    },
    # --- Nhom 4: pose_overall (5 cap tu the nghieng/khoang trong tay/overall) ---
    {
        "pair_id": "P01",
        "group": "pose_overall",
        "category": "upper",
        "person_rel": "image_person_with_bag/person_tiennd/person/p2.jpg",
        "cloth_rel": "image_person_with_bag/person/clothe/c200.jpg",
        "challenge_note": "Tay chong hong tao lo rong giua khuyu tay va eo (de bi convex hull lap kin)",
    },
    {
        "pair_id": "P02",
        "group": "pose_overall",
        "category": "upper",
        "person_rel": "image_person_with_bag/person/person/p203.jpeg",
        "cloth_rel": "image_person_with_bag/person_tiennd/clothe/c47.jpg",
        "challenge_note": "Tu the nghieng nguoi + tay gio chu V + chan co + day deo cheo",
    },
    {
        "pair_id": "P03",
        "group": "pose_overall",
        "category": "upper",
        "person_rel": "image_person_with_bag/dataset/models/female/coffee_cup/unsplash_4ahnuIyeaHA.jpg",
        "cloth_rel": "image_person_with_bag/person/clothe/c202.jpg",
        "challenge_note": "Goc nghieng 90 do + la cay va coc nuoc che truoc bung",
    },
    {
        "pair_id": "P04",
        "group": "pose_overall",
        "category": "upper",
        "person_rel": "datacard/test_img/000445_0.jpg",
        "cloth_rel": "datacard/test_color/009332_1.jpg",
        "challenge_note": "Tay dat hong tao khoang ho nach/eo (W06 P-12)",
    },
    {
        "pair_id": "P05",
        "group": "pose_overall",
        "category": "overall",
        "person_rel": "image_person_with_bag/person_tiennd/person/p3.jpg",
        "cloth_rel": "image_person_with_bag/person_tiennd/clothe/c36.jpg",
        "challenge_note": "Thay ca bo trang phuc (overall) voi hai tay dan truoc bung cam tui",
    },
]


def file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def build_and_verify_manifest(base_seed: int = 42) -> dict:
    os.makedirs(os.path.dirname(MANIFEST_JSON), exist_ok=True)
    records = []
    for idx, item in enumerate(FROZEN_PAIRS_SPEC):
        p_abs = os.path.join(ROOT_DIR, item["person_rel"])
        c_abs = os.path.join(ROOT_DIR, item["cloth_rel"])
        if not os.path.isfile(p_abs):
            raise FileNotFoundError(f"Thieu anh nguoi mau: {p_abs}")
        if not os.path.isfile(c_abs):
            raise FileNotFoundError(f"Thieu anh trang phuc: {c_abs}")

        with Image.open(p_abs) as ip:
            pw, ph = ip.size
        with Image.open(c_abs) as ic:
            cw, ch = ic.size

        # Seed rieng cho tung cap theo pair_id de thu tu chay hoac chia 1/2 GPU khong doi ket qua
        pair_hash = int(hashlib.sha256(f"{base_seed}:{item['pair_id']}".encode("utf-8")).hexdigest()[:8], 16)
        pair_seed = (base_seed + idx * 101 + (pair_hash % 10000)) % (2**31 - 1)

        rec = {
            "index": idx + 1,
            "pair_id": item["pair_id"],
            "group": item["group"],
            "category": item["category"],
            "person_rel": item["person_rel"],
            "cloth_rel": item["cloth_rel"],
            "person_file": f"{item['pair_id']}_person{os.path.splitext(item['person_rel'])[1].lower()}",
            "cloth_file": f"{item['pair_id']}_cloth{os.path.splitext(item['cloth_rel'])[1].lower()}",
            "person_sha256": file_sha256(p_abs),
            "cloth_sha256": file_sha256(c_abs),
            "person_size": [pw, ph],
            "cloth_size": [cw, ch],
            "pair_seed": pair_seed,
            "challenge_note": item["challenge_note"],
        }
        records.append(rec)

    manifest = {
        "schema_version": "w08-frozen-v1",
        "base_seed": base_seed,
        "total_pairs": len(records),
        "dataset_note": (
            "Tap 20 cap co dinh lay tu datacard/ va image_person_with_bag/ trong repo. "
            "Khong co flat-lay quan/chan vay rieng trong du lieu goc nen chi danh gia upper (19) va overall (1)."
        ),
        "pairs": records,
    }

    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    fieldnames = [
        "index", "pair_id", "group", "category", "person_rel", "cloth_rel",
        "person_file", "cloth_file", "person_sha256", "cloth_sha256", "pair_seed", "challenge_note",
    ]
    with open(MANIFEST_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in records:
            w.writerow({k: r[k] for k in fieldnames})

    return manifest


def verify_manifest(manifest_path: str = MANIFEST_JSON, root_dir: str = ROOT_DIR) -> tuple[bool, list[str]]:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    errors = []
    seen_ids = set()
    for r in manifest.get("pairs", []):
        pid = r["pair_id"]
        if pid in seen_ids:
            errors.append(f"Trung pair_id: {pid}")
        seen_ids.add(pid)
        p_abs = os.path.join(root_dir, r["person_rel"])
        c_abs = os.path.join(root_dir, r["cloth_rel"])
        if not os.path.isfile(p_abs):
            errors.append(f"{pid}: khong thay {r['person_rel']}")
            continue
        if not os.path.isfile(c_abs):
            errors.append(f"{pid}: khong thay {r['cloth_rel']}")
            continue
        if file_sha256(p_abs) != r["person_sha256"]:
            errors.append(f"{pid}: sai SHA-256 person ({r['person_rel']})")
        if file_sha256(c_abs) != r["cloth_sha256"]:
            errors.append(f"{pid}: sai SHA-256 cloth ({r['cloth_rel']})")
    return len(errors) == 0, errors


if __name__ == "__main__":
    m = build_and_verify_manifest()
    ok, errs = verify_manifest()
    print(f"Created manifest: {m['total_pairs']} pairs | Verify OK={ok} | Errors={errs}")
