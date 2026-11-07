const RAW_FILENAME_PATTERN =
  /^(upload_|cropped_|img_|image_|photo_|dsc_|screenshot_|frame_|temp_|[0-9a-f]{12,}|\d+[_-])/i;

export function getCleanGarmentTitle(item) {
  if (!item) return "Mẫu Trang Phục";
  const explicitName = item.name || item.productName || item.title;
  if (explicitName && !RAW_FILENAME_PATTERN.test(explicitName.trim())) {
    return explicitName.trim();
  }

  const rawFile = item.originalFilename || "";
  const withoutExt = rawFile.replace(/\.[a-z0-9]+$/i, "").trim();
  if (withoutExt && !RAW_FILENAME_PATTERN.test(withoutExt) && !withoutExt.includes("_")) {
    return withoutExt;
  }

  return item.imageId ? `Mẫu Trang Phục #${item.imageId}` : "Mẫu Trang Phục";
}
