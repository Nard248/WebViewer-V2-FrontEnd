// src/components/viewer/CBRSPopupSystem.tsx
import { CBRSLicense } from '../../services/cbrsService';

export const createCBRSPopupHTML = (licenses: CBRSLicense[], countyName: string): string => {
	const popupId = `cbrs-popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const licensesHtml = licenses.map(license => `
        <tr>
            <td title="${license.channel}">${license.channel}</td>
            <td title="${license.county_name}">${license.county_name}</td>
            <td title="${license.bidder}">${license.bidder}</td>
        </tr>
    `).join('');

	return `
        <style>
        .cbrs-popup-container-${popupId} {
            font-family: Arial, sans-serif;
            max-width: 600px;
            max-height: 400px;
            overflow-y: auto;
            position: relative;
            padding: 20px;
            margin: 0;
            box-sizing: border-box;
        }

        .cbrs-copy-btn-${popupId} {
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        }

        .cbrs-copy-btn-${popupId}:hover {
            background-color: #45a049;
        }

        .cbrs-table-${popupId} {
            width: 100%;
            border-collapse: collapse;
            font-family: Arial, sans-serif;
            margin: 0;
        }

        .cbrs-table-${popupId} th,
        .cbrs-table-${popupId} td {
            max-width: 180px;
            height: 45px;
            border: 1px solid #ddd;
            padding: 15px;
            text-align: left;
            min-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
						font-size: 10px;
        }

        .cbrs-table-${popupId} th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
						 table-layout: fixed;
        }

        .cbrs-table-${popupId} tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        .cbrs-table-${popupId} tr:hover {
            background-color: #ddd;
        }

        .cbrs-header-${popupId} {
            font-weight: bold;
            font-size: 11px;
            color: #333;
            padding: 15px 15px 0 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .no-licenses-${popupId} {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
				
				.leaflet-container a.leaflet-popup-close-button {
					position: absolute;
					top: 0;
					right: 8px;
					border: none;
					text-align: center;
					width: 24px;
					height: 24px;
					font: 16px / 24px Tahoma, Verdana, sans-serif;
					color: #757575;
					text-decoration: none;
					background: transparent;
				}
        </style>

        <div class="cbrs-popup-container-${popupId}">
            <button class="cbrs-copy-btn-${popupId}" onclick="copyCBRSContent_${popupId}()">Copy</button>
            <div class="cbrs-header-${popupId}" title="CBRS PAL License Holders">CBRS PAL License Holders</div>

            ${licenses.length > 0 ? `
                <table class="cbrs-table-${popupId}">
                    <tr>
                        <th>Channel</th>
                        <th>County</th>
                        <th>Bidder</th>
                    </tr>
                    ${licensesHtml}
                </table>
            ` : `
                <div class="no-licenses-${popupId}">No CBRS licenses found for this county.</div>
            `}
        </div>

        <script>
        function copyCBRSContent_${popupId}() {
            let textContent = 'CBRS PAL License Holders\\n';
            textContent += 'County: ${countyName}\\n\\n';

            if (${licenses.length} > 0) {
                textContent += 'Channel\\tCounty\\tBidder\\n';
                textContent += '${licenses.map(l => `${l.channel}\\t${l.county_name}\\t${l.bidder}`).join('\\n')}';
            } else {
                textContent += 'No CBRS licenses found for this county.';
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textContent).then(() => {
                    const btn = document.querySelector('.cbrs-copy-btn-${popupId}');
                    if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => {
                            btn.textContent = originalText;
                        }, 2000);
                    }
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            }
        }
        </script>
    `;
};