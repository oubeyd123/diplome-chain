import { jsPDF } from "jspdf";

// Guilloché rosette (same pattern as the one on the site), drawn as a light
// watermark. jsPDF cannot rotate ellipses, so each one is a closed polyline.
function drawRosette(doc, cx, cy, radius) {
  const n = 28;
  const steps = 90;
  const rx = radius * 0.96;
  const ry = radius * 0.355;
  doc.setDrawColor(214, 218, 238);
  doc.setLineWidth(0.15);
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI) / n;
    const pts = [];
    for (let k = 0; k <= steps; k++) {
      const t = (k / steps) * 2 * Math.PI;
      const x = rx * Math.cos(t);
      const y = ry * Math.sin(t);
      pts.push([
        cx + x * Math.cos(a) - y * Math.sin(a),
        cy + x * Math.sin(a) + y * Math.cos(a),
      ]);
    }
    const deltas = pts
      .slice(1)
      .map((p, k) => [p[0] - pts[k][0], p[1] - pts[k][1]]);
    doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], "S", true);
  }
  doc.circle(cx, cy, radius * 0.12);
  doc.circle(cx, cy, radius);
}

// Builds a simple diploma PDF. jsPDF stamps a creation date in the metadata,
// so generating twice gives two different hashes: always hash and upload the
// exact File returned here.
export function genererDiplomePdf({ nom, prenom, filiere, annee }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const cx = 148.5;

  doc.setDrawColor(18, 38, 43);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, 281, 194);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, 273, 186);

  drawRosette(doc, cx, 105, 75); // behind the text: drawn first

  doc.setTextColor(18, 38, 43);
  doc.setFont("times", "bold");
  doc.setFontSize(40);
  doc.text("DIPLÔME", cx, 55, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("Il est certifié que", cx, 85, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text(`${prenom.trim()} ${nom.trim().toUpperCase()}`, cx, 108, {
    align: "center",
  });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("a validé avec succès le cursus de", cx, 128, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text(filiere.trim(), cx, 145, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text(`Année universitaire ${annee}`, cx, 160, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    `Délivré le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })} — authenticité vérifiable sur la blockchain`,
    cx,
    185,
    { align: "center" },
  );

  const name =
    `diplome-${nom.trim()}-${prenom.trim()}`
      .toLowerCase()
      .replace(/\s+/g, "-") + ".pdf";
  return new File([doc.output("blob")], name, { type: "application/pdf" });
}
