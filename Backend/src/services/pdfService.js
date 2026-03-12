import PDFDocument from 'pdfkit';

/**
 * Generates a professional PDF report for grain analysis.
 * @param {Object} data - The report data from MongoDB.
 * @returns {Promise<Buffer>} - The generated PDF as a buffer.
 */
export async function generateGrainReportPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // --- Colors & Styles ---
            const colors = {
                primary: '#3d6f4d',
                secondary: '#405948',
                text: '#223328',
                muted: '#666666',
                lightBg: '#f7faf7',
                border: '#ccd6cc'
            };

            // --- Header ---
            doc.rect(0, 0, doc.page.width, 100).fill(colors.primary);
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff').text('GRAIN QUALITY ANALYSIS REPORT', 50, 40);
            doc.fontSize(10).font('Helvetica').fillColor('#eef2ef').text(`Batch ID: ${data.reportId || 'N/A'}`, 50, 70);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 350, 70, { align: 'right' });

            doc.moveDown(5);

            // --- Main Grid: Summary & Grade ---
            const startY = doc.y;

            // Left Column: Grade & Purity
            doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.text).text('Summary Overview', 50, startY);
            doc.moveDown(0.5);

            const drawInfoRow = (label, value) => {
                doc.fontSize(10).font('Helvetica').fillColor(colors.muted).text(label, 60, doc.y);
                doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text(value, 200, doc.y - 12);
                doc.moveDown(0.8);
            };

            doc.y += 10;
            drawInfoRow('Overall Grade:', data.grade || 'Pending');
            drawInfoRow('Purity Percentage:', `${data.purity}%`);

            const priceVal = data.aiOutputs?.price?.value;
            const priceText = priceVal ? `Rs. ${priceVal} per quintal` : 'Analysis Pending';
            drawInfoRow('Predicted Price:', priceText);

            const shelfVal = data.aiOutputs?.shelfLife?.value;
            const shelfUnit = data.aiOutputs?.shelfLife?.unit || 'days';
            const shelfText = shelfVal ? `${shelfVal} ${shelfUnit}` : 'Analysis Pending';
            drawInfoRow('Est. Shelf Life:', shelfText);

            drawInfoRow('Analysis Model:', 'GrainSense AI Pro v4');

            // Right Column: Grade Badge
            const badgeX = 400;
            doc.rect(badgeX, startY, 150, 80).fill(colors.lightBg);
            doc.fontSize(10).font('Helvetica').fillColor(colors.secondary).text('QUALITY GRADE', badgeX + 35, startY + 15);
            doc.fontSize(40).font('Helvetica-Bold').fillColor(colors.primary).text(data.grade || '-', badgeX + 60, startY + 35);

            // Ensure Sensor Diagnostics starts safely below the summary
            doc.y = Math.max(doc.y, startY + 130);

            // --- Sensor Section ---
            doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.text).text('Sensor Diagnostics', 50, doc.y);
            doc.moveDown(1);

            const sensorY = doc.y;
            const ss = data.sensorSnapshot || {};
            const sensorItems = [
                { label: 'Temperature', value: ss.temperature ? `${ss.temperature}°C` : 'N/A' },
                { label: 'Moisture', value: ss.moisture ? `${ss.moisture}%` : 'N/A' },
                { label: 'Humidity', value: ss.humidity ? `${ss.humidity}%` : 'N/A' }
            ];

            sensorItems.forEach((item, i) => {
                const x = 50 + (i * 175);
                doc.rect(x, sensorY, 160, 50).fill(colors.lightBg);
                doc.fontSize(9).font('Helvetica').fillColor(colors.muted).text(item.label.toUpperCase(), x + 10, sensorY + 12);
                doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.text).text(item.value, x + 10, sensorY + 28);
            });

            doc.y = sensorY + 90;

            // --- Composition Section ---
            doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.text).text('Detailed Composition Analysis', 50, doc.y);
            doc.moveDown(0.8);

            // Table Header
            const tableTop = doc.y;
            doc.rect(50, tableTop, 500, 20).fill(colors.secondary);
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text('IMPURITY TYPE', 60, tableTop + 6);
            doc.text('PERCENTAGE', 250, tableTop + 6);
            doc.text('SEVERITY', 400, tableTop + 6);

            let currentY = tableTop + 20;
            const imps = data.impurities || {};
            const impurityList = Object.entries(imps).filter(([_, val]) => typeof val === 'number');

            if (impurityList.length > 0) {
                impurityList.forEach(([key, val], idx) => {
                    if (idx % 2 === 1) doc.rect(50, currentY, 500, 20).fill('#f9faf9');

                    doc.fontSize(10).font('Helvetica').fillColor(colors.text);
                    // Proper casing for keys (e.g., blackSpots -> Black Spots)
                    const typeLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                    doc.text(typeLabel, 60, currentY + 5);
                    doc.text(`${val.toFixed(2)}%`, 250, currentY + 5);

                    const severity = val > 5 ? 'High' : val > 2 ? 'Medium' : 'Low';
                    const sevColor = severity === 'High' ? '#c54a3a' : severity === 'Medium' ? '#d97706' : colors.primary;

                    doc.fillColor(sevColor).text(severity, 400, currentY + 5);
                    currentY += 20;
                });
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').fillColor(colors.muted).text('No detailed impurity data available.', 60, currentY + 10);
                currentY += 30;
            }

            doc.y = currentY + 40;

            // --- AI Recommendations ---
            doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.text).text('AI Advisory & Storage Recommendations', 50, doc.y);
            doc.moveDown(0.5);

            const advisoryText = data.aiOutputs?.advisory?.text || 'Maintain standard storage conditions. Ensure proper moisture-controlled environment to prevent degradation.';

            doc.rect(50, doc.y, 500, 70).fill(colors.lightBg);
            doc.fontSize(10).font('Helvetica').fillColor(colors.text).text(advisoryText, 65, doc.y + 15, {
                width: 470,
                lineGap: 4
            });

            // --- Footer ---
            const pageHeight = doc.page.height;
            doc.fontSize(8).fillColor(colors.muted).text('CONFIDENTIAL | GRAIN QUALITY REPORT | AI SYSTEMS INC.', 50, pageHeight - 50, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
