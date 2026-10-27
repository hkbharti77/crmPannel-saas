import { EmailBuilderDocument, EmailBlock } from './types';

export function createDefaultEmailDocument(): EmailBuilderDocument {
  return {
    version: 1,
    settings: {
      maxWidth: 600,
      canvasBg: '#f8fafc',
      bodyBg: '#ffffff',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      defaultTextColor: '#0f172a',
    },
    blocks: [
      {
        id: 'block-header',
        type: 'header',
        data: {
          title: 'ACME Real Estate & Wealth',
          subtitle: 'Exclusive Investment Opportunities',
          alignment: 'center',
          bgColor: '#ffffff',
          textColor: '#0f172a',
        },
      },
      {
        id: 'block-hero',
        type: 'hero',
        data: {
          headline: 'Unlock 12% Projected Yield on Luxury Villas',
          subheadline: 'Handpicked turnkey properties in prime metropolitan corridors with guaranteed rental demand.',
          buttonText: 'View Property Catalog',
          buttonUrl: 'https://example.com/properties',
          bgColor: '#0f172a',
          textColor: '#ffffff',
        },
      },
      {
        id: 'block-text-1',
        type: 'text',
        data: {
          content: 'Hi {{name}},<br/><br/>We are thrilled to present our curated Q4 investment portfolio. Every property has been pre-inspected, legally vetted, and packaged with zero hidden brokerage fees.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#334155',
          alignment: 'left',
        },
      },
      {
        id: 'block-button-1',
        type: 'button',
        data: {
          text: 'Schedule a Private Consultation',
          url: 'https://example.com/consultation',
          alignment: 'center',
          bgColor: '#2563eb',
          textColor: '#ffffff',
          borderRadius: 8,
          fullWidth: false,
        },
      },
      {
        id: 'block-divider-1',
        type: 'divider',
        data: {
          style: 'solid',
          color: '#e2e8f0',
          thickness: 1,
          marginY: 24,
        },
      },
      {
        id: 'block-footer',
        type: 'footer',
        data: {
          companyName: 'ChatCRM Global Realty Inc.',
          address: '450 Lexington Ave, Suite 1400, New York, NY 10017',
          unsubscribeNotice: 'You are receiving this email because you subscribed to property alerts. <br/><a href="{{unsubscribe_link}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> at any time.',
          textColor: '#94a3b8',
          bgColor: '#f8fafc',
        },
      },
    ],
  };
}

export function validateEmailDocument(doc: EmailBuilderDocument): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!doc.blocks || doc.blocks.length === 0) {
    errors.push('Email canvas must contain at least one block.');
  }

  const footerBlock = doc.blocks.find((b) => b.type === 'footer');
  if (!footerBlock) {
    errors.push('Compliance requirement: An email must contain a Footer block with {{unsubscribe_link}}.');
  } else {
    const footerData = footerBlock.data as { unsubscribeNotice?: string };
    if (!footerData.unsubscribeNotice || !footerData.unsubscribeNotice.includes('{{unsubscribe_link}}')) {
      errors.push('Footer block must include the {{unsubscribe_link}} tag for CAN-SPAM and GDPR compliance.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function compileEmailHtml(doc: EmailBuilderDocument): string {
  const { settings, blocks } = doc;
  const maxWidth = settings.maxWidth || 600;
  const canvasBg = settings.canvasBg || '#f8fafc';
  const bodyBg = settings.bodyBg || '#ffffff';
  const fontFamily = settings.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const defaultTextColor = settings.defaultTextColor || '#0f172a';

  let compiledBlocksHtml = '';

  for (const block of blocks) {
    compiledBlocksHtml += compileSingleBlock(block, defaultTextColor);
  }

  // Ensure unsubscribe link is present in the final compiled markup for legal compliance
  if (!compiledBlocksHtml.includes('{{unsubscribe_link}}')) {
    compiledBlocksHtml += `
      <tr>
        <td style="padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; font-family: ${fontFamily}; border-top: 1px solid #e2e8f0;">
          <a href="{{unsubscribe_link}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> from marketing emails.
        </td>
      </tr>
    `;
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Email Notification</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100%; background-color: ${canvasBg}; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .stack-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${canvasBg}; font-family: ${fontFamily}; color: ${defaultTextColor};">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${canvasBg};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="${maxWidth}">
        <tr>
        <td align="center" valign="top" width="${maxWidth}">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: ${maxWidth}px; background-color: ${bodyBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          ${compiledBlocksHtml}
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function compileSingleBlock(block: EmailBlock, defaultTextColor: string): string {
  switch (block.type) {
    case 'header': {
      const d = block.data as any;
      const logoHtml = d.logoUrl
        ? `<div style="margin-bottom: 12px;"><img src="${escapeAttr(d.logoUrl)}" alt="Logo" style="max-height: 48px; max-width: 180px; display: inline-block;" /></div>`
        : '';
      const subtitleHtml = d.subtitle
        ? `<div style="font-size: 13px; color: #64748b; font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(d.subtitle)}</div>`
        : '';

      return `
        <tr>
          <td align="${d.alignment || 'center'}" style="background-color: ${d.bgColor || '#ffffff'}; padding: 32px 24px 20px 24px;">
            ${logoHtml}
            <div style="font-size: 24px; font-weight: 800; color: ${d.textColor || defaultTextColor}; line-height: 1.25; letter-spacing: -0.02em;">
              ${escapeHtml(d.title || '')}
            </div>
            ${subtitleHtml}
          </td>
        </tr>
      `;
    }

    case 'hero': {
      const d = block.data as any;
      const imgHtml = d.imageUrl
        ? `<div style="margin-bottom: 20px;"><img src="${escapeAttr(d.imageUrl)}" alt="Hero" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; display: block;" /></div>`
        : '';
      const subheadlineHtml = d.subheadline
        ? `<div style="font-size: 16px; color: ${d.textColor || '#ffffff'}cc; line-height: 1.5; margin-bottom: 24px;">${escapeHtml(d.subheadline)}</div>`
        : '';
      const btnHtml = d.buttonText && d.buttonUrl
        ? `<div><a href="${escapeAttr(d.buttonUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">${escapeHtml(d.buttonText)}</a></div>`
        : '';

      return `
        <tr>
          <td align="center" style="background-color: ${d.bgColor || '#0f172a'}; padding: 40px 28px; text-align: center;">
            ${imgHtml}
            <div style="font-size: 26px; font-weight: 800; color: ${d.textColor || '#ffffff'}; line-height: 1.3; margin-bottom: 12px; letter-spacing: -0.02em;">
              ${escapeHtml(d.headline || '')}
            </div>
            ${subheadlineHtml}
            ${btnHtml}
          </td>
        </tr>
      `;
    }

    case 'text': {
      const d = block.data as any;
      return `
        <tr>
          <td align="${d.alignment || 'left'}" style="padding: 16px 28px; font-size: ${d.fontSize || 15}px; line-height: ${d.lineHeight || 1.6}; color: ${d.color || '#334155'}; text-align: ${d.alignment || 'left'};">
            ${d.content || ''}
          </td>
        </tr>
      `;
    }

    case 'button': {
      const d = block.data as any;
      const align = d.alignment || 'center';
      const fullWidthStyle = d.fullWidth ? 'width: 100%; display: block; text-align: center;' : 'display: inline-block;';

      return `
        <tr>
          <td align="${align}" style="padding: 20px 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="${d.fullWidth ? 'width: 100%;' : ''}">
              <tr>
                <td align="${align}">
                  <a href="${escapeAttr(d.url || '#')}" style="background-color: ${d.bgColor || '#2563eb'}; color: ${d.textColor || '#ffffff'}; padding: 14px 32px; border-radius: ${d.borderRadius ?? 8}px; font-weight: 700; font-size: 15px; text-decoration: none; ${fullWidthStyle} box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                    ${escapeHtml(d.text || 'Click Here')}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'image': {
      const d = block.data as any;
      const captionHtml = d.caption
        ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px; text-align: ${d.alignment || 'center'};">${escapeHtml(d.caption)}</div>`
        : '';
      const imgTag = `<img src="${escapeAttr(d.imageUrl || '')}" alt="${escapeAttr(d.alt || 'Image')}" style="max-width: ${d.maxWidth ? d.maxWidth + '%' : '100%'}; height: auto; display: block; border-radius: 8px; margin: 0 ${d.alignment === 'center' ? 'auto' : d.alignment === 'right' ? '0 0 auto' : 'auto 0 0'};" />`;
      const linkedImg = d.linkUrl ? `<a href="${escapeAttr(d.linkUrl)}" target="_blank">${imgTag}</a>` : imgTag;

      return `
        <tr>
          <td align="${d.alignment || 'center'}" style="padding: 16px 28px;">
            ${linkedImg}
            ${captionHtml}
          </td>
        </tr>
      `;
    }

    case 'grid2': {
      const d = block.data as any;
      const btn1 = d.col1ButtonText && d.col1ButtonUrl
        ? `<div style="margin-top: 14px;"><a href="${escapeAttr(d.col1ButtonUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block;">${escapeHtml(d.col1ButtonText)}</a></div>`
        : '';
      const btn2 = d.col2ButtonText && d.col2ButtonUrl
        ? `<div style="margin-top: 14px;"><a href="${escapeAttr(d.col2ButtonUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block;">${escapeHtml(d.col2ButtonText)}</a></div>`
        : '';

      return `
        <tr>
          <td style="padding: 20px 24px; background-color: ${d.bgColor || '#ffffff'};">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="48%" valign="top" class="stack-column" style="background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                  <div style="font-size: 17px; font-weight: 700; color: ${d.textColor || '#0f172a'}; margin-bottom: 6px;">${escapeHtml(d.col1Title || '')}</div>
                  <div style="font-size: 14px; line-height: 1.5; color: #475569;">${escapeHtml(d.col1Text || '')}</div>
                  ${btn1}
                </td>
                <td width="4%" class="stack-column" style="font-size: 0; line-height: 0;">&nbsp;</td>
                <td width="48%" valign="top" class="stack-column" style="background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 17px; font-weight: 700; color: ${d.textColor || '#0f172a'}; margin-bottom: 6px;">${escapeHtml(d.col2Title || '')}</div>
                  <div style="font-size: 14px; line-height: 1.5; color: #475569;">${escapeHtml(d.col2Text || '')}</div>
                  ${btn2}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'divider': {
      const d = block.data as any;
      const borderStyle = d.style || 'solid';
      const color = d.color || '#e2e8f0';
      const thickness = d.thickness || 1;
      const marginY = d.marginY ?? 20;

      return `
        <tr>
          <td style="padding: ${marginY}px 28px;">
            <div style="border-top: ${thickness}px ${borderStyle} ${color}; width: 100%;"></div>
          </td>
        </tr>
      `;
    }

    case 'spacer': {
      const d = block.data as any;
      const height = d.height || 24;
      return `
        <tr>
          <td height="${height}" style="font-size: 0; line-height: ${height}px; height: ${height}px;">&nbsp;</td>
        </tr>
      `;
    }

    case 'social': {
      const d = block.data as any;
      const links: string[] = [];

      if (d.twitterUrl) {
        links.push(`<a href="${escapeAttr(d.twitterUrl)}" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 13px;">Twitter / X</a>`);
      }
      if (d.linkedinUrl) {
        links.push(`<a href="${escapeAttr(d.linkedinUrl)}" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 13px;">LinkedIn</a>`);
      }
      if (d.facebookUrl) {
        links.push(`<a href="${escapeAttr(d.facebookUrl)}" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 13px;">Facebook</a>`);
      }
      if (d.instagramUrl) {
        links.push(`<a href="${escapeAttr(d.instagramUrl)}" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 13px;">Instagram</a>`);
      }
      if (d.youtubeUrl) {
        links.push(`<a href="${escapeAttr(d.youtubeUrl)}" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 13px;">YouTube</a>`);
      }

      return `
        <tr>
          <td align="${d.alignment || 'center'}" style="padding: 16px 28px; text-align: ${d.alignment || 'center'};">
            ${links.length > 0 ? links.join('&nbsp;•&nbsp;') : '<span style="color: #94a3b8; font-size: 12px;">Follow Us</span>'}
          </td>
        </tr>
      `;
    }

    case 'footer': {
      const d = block.data as any;
      return `
        <tr>
          <td align="center" style="background-color: ${d.bgColor || '#f8fafc'}; padding: 32px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 13px; color: ${d.textColor || '#64748b'}; margin-bottom: 6px;">
              ${escapeHtml(d.companyName || '')}
            </div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px;">
              ${escapeHtml(d.address || '')}
            </div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              ${d.unsubscribeNotice || '<a href="{{unsubscribe_link}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> from marketing emails.'}
            </div>
          </td>
        </tr>
      `;
    }

    default:
      return '';
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str: string): string {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
