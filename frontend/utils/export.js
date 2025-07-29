import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function exportCode(jsx, css) {
  const zip = new JSZip();
  zip.file("Component.jsx", jsx);
  zip.file("styles.css", css);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "component.zip");
}
