import config from '@app/config/index.js';
import nodemailer from 'nodemailer'; 

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[] = [],
) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.nodemailer_host_email,
      pass: config.nodemailer_host_pass,
    },
  });

  await transporter.sendMail({
    from: config.nodemailer_host_email,
    to, // list of receivers
    subject,
    text: '', // plain text body
    html, // html body
    attachments,
  });
};
