// ============================================================
// Nén ảnh trong public/assets/uploads cho nhẹ trang web.
//
// Vì sao cần: ảnh bìa bài viết tải về thẳng máy người đọc. Ảnh 8 MB khiến
// người xem bằng điện thoại phải chờ rất lâu rồi bỏ đi. Quy ước dự án:
// mỗi ảnh không quá 300 KB.
//
// Cách chạy:
//   npm run xem-anh    → chỉ liệt kê, KHÔNG sửa gì
//   npm run nen-anh    → nén thật (ghi đè ảnh gốc, hãy sao lưu trước)
//
// Quy tắc nén:
//   - Ảnh rộng quá 2000 điểm ảnh  → thu về đúng 2000, giữ nguyên tỉ lệ
//   - Ảnh .jpg  → lưu lại dạng JPEG chất lượng 88 (nét, vẫn nhẹ), giữ nguyên tên
//   - Ảnh .png CÓ NỀN TRONG SUỐT THẬT (logo) → giữ nguyên dạng PNG, không đụng nền
//   - Ảnh .png ĐỤC HOÀN TOÀN (ảnh minh hoạ chỉ thừa kênh trong suốt) → đổi sang
//     dạng .jpg cho nhẹ hơn hàng chục lần, ĐỒNG THỜI tự sửa mọi chỗ nhắc tên ảnh
//     đó trong src/ để bài viết không bị mất ảnh
// ============================================================
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const thuMucAnh = path.resolve("public/assets/uploads");
const chieuRongToiDa = 2000;
const chatLuongJpeg = 88;
const chiXem = process.argv.includes("--xem");

if (!fs.existsSync(thuMucAnh)) {
  console.error("Không tìm thấy thư mục ảnh: " + thuMucAnh);
  process.exit(1);
}

// Đổi tên một ảnh ở mọi chỗ nhắc tới nó trong src/ (bài viết, trang, bố cục).
// Trả về số chỗ đã sửa, để in ra cho người dùng thấy và đối chiếu.
function doiTenAnhTrongNoiDung(tenCu, tenMoi) {
  let soCho = 0;
  const duyet = (thuMuc) => {
    for (const muc of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      const duongDan = path.join(thuMuc, muc.name);
      if (muc.isDirectory()) {
        duyet(duongDan);
      } else if (/\.(md|astro|ts|js|mjs|json)$/i.test(muc.name)) {
        const noiDung = fs.readFileSync(duongDan, "utf8");
        if (noiDung.includes(tenCu)) {
          fs.writeFileSync(duongDan, noiDung.split(tenCu).join(tenMoi), "utf8");
          soCho++;
        }
      }
    }
  };
  const thuMucNguon = path.resolve("src");
  if (fs.existsSync(thuMucNguon)) duyet(thuMucNguon);
  return soCho;
}

const duoiAnh = [".jpg", ".jpeg", ".png", ".webp"];
const dsAnh = fs
  .readdirSync(thuMucAnh)
  .filter((ten) => duoiAnh.includes(path.extname(ten).toLowerCase()))
  .sort();

console.log(chiXem ? "== CHỈ XEM, không sửa gì ==" : "== NÉN THẬT, ghi đè ảnh gốc ==");
console.log("Thư mục: " + thuMucAnh);
console.log("");

let tongTruoc = 0;
let tongSau = 0;
let soAnhDaNen = 0;

for (const ten of dsAnh) {
  const duongDan = path.join(thuMucAnh, ten);
  const cuKB = fs.statSync(duongDan).size / 1024;
  tongTruoc += cuKB;

  const thongTin = await sharp(duongDan).metadata();
  const coNenTrongSuot = Boolean(thongTin.hasAlpha);
  const canThuNho = thongTin.width > chieuRongToiDa;

  if (chiXem) {
    console.log(
      [
        String(Math.round(cuKB)).padStart(6) + " KB",
        (thongTin.width + "x" + thongTin.height).padStart(11),
        thongTin.format.padEnd(4),
        coNenTrongSuot ? "nền trong suốt" : "nền đục       ",
        ten,
      ].join("  ")
    );
    tongSau += cuKB;
    continue;
  }

  let anh = sharp(duongDan);
  if (canThuNho) anh = anh.resize({ width: chieuRongToiDa, withoutEnlargement: true });

  const duoi = path.extname(ten).toLowerCase();
  let tenMoi = ten;

  if (duoi === ".png") {
    // Kênh trong suốt có thể chỉ là hình thức: mọi điểm ảnh đều đục (giá trị 255).
    // Ảnh như vậy chuyển sang JPEG nhẹ hơn hàng chục lần mà mắt không thấy khác.
    const thongKe = await sharp(duongDan).stats();
    const kenhTrongSuot = thongKe.channels[3];
    const trongSuotThat = coNenTrongSuot && kenhTrongSuot && kenhTrongSuot.min < 255;

    if (trongSuotThat) {
      anh = anh.png({ compressionLevel: 9, palette: true, quality: 90, effort: 8 });
    } else {
      anh = anh.flatten({ background: "#ffffff" }).jpeg({ quality: chatLuongJpeg, mozjpeg: true });
      tenMoi = ten.slice(0, -4) + ".jpg";
    }
  } else if (duoi === ".webp") {
    anh = anh.webp({ quality: chatLuongJpeg });
  } else {
    anh = anh.jpeg({ quality: chatLuongJpeg, mozjpeg: true });
  }

  // Ghi ra tập tin tạm rồi mới thay thế — tránh hỏng ảnh gốc nếu nén lỗi giữa chừng
  const tapTinTam = duongDan + ".tam";
  await anh.toFile(tapTinTam);
  const moiKB = fs.statSync(tapTinTam).size / 1024;

  if (moiKB < cuKB) {
    const duongDanMoi = path.join(thuMucAnh, tenMoi);
    fs.renameSync(tapTinTam, duongDanMoi);
    if (tenMoi !== ten) {
      fs.unlinkSync(duongDan);
      const soCho = doiTenAnhTrongNoiDung(ten, tenMoi);
      console.log("  → đổi sang " + tenMoi + " (đã sửa " + soCho + " chỗ nhắc tên trong src/)");
    }
    tongSau += moiKB;
    soAnhDaNen++;
    console.log(
      "  " +
        String(Math.round(cuKB)).padStart(6) +
        " KB →" +
        String(Math.round(moiKB)).padStart(6) +
        " KB   " +
        tenMoi
    );
  } else {
    // Nén xong lại to hơn thì bỏ, giữ ảnh gốc
    fs.unlinkSync(tapTinTam);
    tongSau += cuKB;
    console.log("  giữ nguyên (nén không nhẹ hơn): " + ten);
  }
}

console.log("");
console.log("Số ảnh: " + dsAnh.length + (chiXem ? "" : ", đã nén: " + soAnhDaNen));
console.log(
  "Tổng dung lượng: " +
    (tongTruoc / 1024).toFixed(1) +
    " MB" +
    (chiXem ? "" : " → " + (tongSau / 1024).toFixed(1) + " MB")
);

// Đọc lại thư mục thay vì dùng danh sách ban đầu — vì ảnh .png đục đã đổi sang .jpg
const conNang = fs
  .readdirSync(thuMucAnh)
  .filter((ten) => duoiAnh.includes(path.extname(ten).toLowerCase()))
  .map((ten) => ({ ten, kb: fs.statSync(path.join(thuMucAnh, ten)).size / 1024 }))
  .filter((a) => a.kb > 300)
  .sort((a, b) => b.kb - a.kb);
if (conNang.length) {
  console.log("");
  console.log("⚠️ Còn " + conNang.length + " ảnh vượt ngưỡng 300 KB:");
  for (const a of conNang) console.log("   " + Math.round(a.kb) + " KB  " + a.ten);
}
