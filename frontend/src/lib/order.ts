import "./SolaimanLipi.js";
import dayjs from "dayjs";
import jsPDF from "jspdf";

export function saveAndDownloadOrder(orderData: any) {
  if (!orderData) throw new Error("Order data is required");
  const existing = JSON.parse(localStorage.getItem("placedOrders") || "[]");
  existing.push(orderData);
  localStorage.setItem("placedOrders", JSON.stringify(existing));
  downloadOrder(orderData);
}

function writeTextWithFallback(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    bold?: boolean;
    align?: "left" | "center" | "right";
  } = {}
) {
  const fontSize = options.fontSize || 10;
  const bold = options.bold || false;
  const align = options.align || "left";

  doc.setFontSize(fontSize);

  const runs = text.match(/[\u0980-\u09FF]+|[^\u0980-\u09FF]+/g) || [text];

  let totalWidth = 0;
  const runWidths: number[] = [];

  runs.forEach((run) => {
    const isBangla = /[\u0980-\u09FF]/.test(run);
    doc.setFont(
      isBangla ? "SolaimanLipi" : "helvetica",
      bold ? "bold" : "normal"
    );
    const runWidth = doc.getTextWidth(run);
    runWidths.push(runWidth);
    totalWidth += runWidth;
  });

  let startX = x;
  if (align === "center") {
    startX = x - totalWidth / 2;
  } else if (align === "right") {
    startX = x - totalWidth;
  }

  let currentX = startX;
  runs.forEach((run, index) => {
    const isBangla = /[\u0980-\u09FF]/.test(run);
    doc.setFont(
      isBangla ? "SolaimanLipi" : "helvetica",
      bold ? "bold" : "normal"
    );

    doc.text(run, currentX, y);
    currentX += runWidths[index];
  });

  return currentX;
}

function drawDivider(doc: jsPDF, y: number, margin: number, pageWidth: number) {
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
}

export function downloadOrder(orderData: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Header
  writeTextWithFallback(doc, "ORDER RECEIPT", pageWidth / 2, y, {
    fontSize: 18,
    bold: true,
    align: "center",
  });
  y += 10;

  // Company Name
  writeTextWithFallback(doc, `${orderData?.shopName}`, pageWidth / 2, y, {
    fontSize: 12,
    bold: true,
    align: "center",
  });
  y += 6;

  // Company Info
  const companyInfo = [];

  // Add shop address if available
  if (orderData.shopAddress) {
    let addressLine = orderData.shopAddress;
    if (orderData.shopCity) addressLine += `, ${orderData.shopCity}`;
    if (orderData.shopPostalCode) addressLine += ` ${orderData.shopPostalCode}`;
    if (orderData.shopCountry) addressLine += `, ${orderData.shopCountry}`;
    companyInfo.push(addressLine);
  }

  // Add contact info if available
  const contactParts = [];
  if (orderData.shopEmail) contactParts.push(`Email: ${orderData.shopEmail}`);
  if (orderData.shopPhone) contactParts.push(`Phone: ${orderData.shopPhone}`);
  if (contactParts.length > 0) {
    companyInfo.push(contactParts.join(" | "));
  }
  companyInfo.forEach((line) => {
    writeTextWithFallback(doc, line, pageWidth / 2, y, {
      fontSize: 10,
      align: "center",
    });
    y += 5;
  });

  // Divider
  y += 5;
  drawDivider(doc, y, margin, pageWidth);
  y += 8;

  // Order Information
  writeTextWithFallback(doc, "Order Information", margin, y, {
    fontSize: 12,
    bold: true,
  });
  y += 6;

  const details = [
    ["Order ID", orderData.id || "N/A"],
    ["Shop ID", orderData.shopId || "N/A"],
    ["Customer Name", orderData.customerName || "N/A"],
    ["Customer Phone", orderData.customerPhone || "N/A"],
    ["Customer Address", orderData.customerAddress || "N/A"],
    ["Customer Email", orderData.customerEmail || "N/A"],
    ["Payment Type", orderData.paymentType || "N/A"],
    ["Order Status", orderData.status || "N/A"],
    [
      "Placed At",
      orderData.createdAt
        ? dayjs(orderData.createdAt).format("DD MMM YYYY, hh:mm A")
        : "N/A",
    ],
  ];

  const labelWidth = 45;
  details.forEach(([label, value]) => {
    writeTextWithFallback(doc, `${label}:`, margin, y, {
      fontSize: 10,
    });
    writeTextWithFallback(doc, String(value), margin + labelWidth, y, {
      fontSize: 10,
    });
    y += 5;
  });

  // Divider
  y += 5;
  drawDivider(doc, y, margin, pageWidth);
  y += 8;

  // Items Purchased
  writeTextWithFallback(doc, "Items Purchased", margin, y, {
    fontSize: 12,
    bold: true,
  });
  y += 6;

  const tableStartY = y;
  const colWidths = [
    contentWidth * 0.1,
    contentWidth * 0.45,
    contentWidth * 0.15,
    contentWidth * 0.15,
    contentWidth * 0.15,
  ];
  const rowHeight = 7;
  const tableWidth = contentWidth;

  // Table Header
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, tableWidth, rowHeight, "F");
  const headers = ["No.", "Product Name", "Qty", "Price", "Subtotal"];
  let x = margin;
  headers.forEach((header, i) => {
    writeTextWithFallback(doc, header, x + 3, y + 5, {
      fontSize: 10,
      bold: true,
    });
    x += colWidths[i];
  });
  y += rowHeight;

  // Table Rows
  (orderData.products || []).forEach((p: any, i: number) => {
    const subtotal = p.quantity * (p.product?.price || 0);
    const row = [
      `${i + 1}.`,
      p.product?.name || "N/A",
      String(p.quantity || 0),
      `${(p.product?.price || 0).toFixed(0)} BDT`,
      `${subtotal.toFixed(0)} BDT`,
    ];

    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    x = margin;
    row.forEach((cell, j) => {
      writeTextWithFallback(doc, cell, x + 3, y + 5, { fontSize: 10 });
      x += colWidths[j];
    });
    y += rowHeight;
  });

  // Table Border
  doc.setDrawColor(100);
  doc.rect(margin, tableStartY, tableWidth, y - tableStartY);

  // Total
  y += 8;
  const total = (orderData.products || []).reduce(
    (sum: number, p: any) => sum + p.quantity * (p.product?.price || 0),
    0
  );
  writeTextWithFallback(
    doc,
    `Bill Total: ${total.toFixed(0)} BDT`,
    pageWidth - margin,
    y,
    { fontSize: 12, align: "right" }
  );

  // Footer
  y += 15;
  writeTextWithFallback(
    doc,
    "Thank you for shopping with us!",
    pageWidth / 2,
    y,
    { fontSize: 10, align: "center" }
  );
  y += 5;

  if (orderData.shopEmail) {
    writeTextWithFallback(
      doc,
      `Contact us at ${orderData.shopEmail} for any inquiries.`,
      pageWidth / 2,
      y,
      { fontSize: 10, align: "center" }
    );
  }

  // Save PDF
  doc.save(`order-${orderData.id || Date.now()}.pdf`);
}
