import nodemailer from "nodemailer";

export const sendResetEmail = async (email: string, token: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const resetLink = `http://localhost:3000/set-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Set your password",
        html: `
            <p>Click the link below to set your password:</p>
            <a href="${resetLink}">${resetLink}</a>
        `,
    });
};