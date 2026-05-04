import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateDataSummary(data: any[], headers: string[]) {
  const model = "gemini-3-flash-preview";
  
  // Prepare a sample of the data to avoid token limits if data is huge
  const dataSample = data.slice(0, 50); 
  const dataString = JSON.stringify(dataSample);

  const prompt = `
    Anda adalah seorang analis data ahli. Berikut adalah cuplikan data dari sebuah Google Sheet:
    Kolom: ${headers.join(', ')}
    Data (50 baris pertama): ${dataString}

    Tugas:
    1. Berikan salam pembuka yang singkat dan bersahabat.
    2. Jelaskan tren aktivitas operasional transmisi secara objektif berdasarkan data.
    3. Identifikasi pola kinerja tim dan kendala teknis yang muncul tanpa menggunakan sudut pandang orang pertama (hindari kata "saya", "kami", "kita").
    4. Sajikan analisis dalam bentuk laporan yang mengalir namun santai.
    5. Berikan saran praktis untuk optimalisasi operasional.
    
    PENTING: 
    - Gunakan Bahasa Indonesia yang baku namun tetap santai (semi-formal).
    - JANGAN gunakan kata ganti orang pertama (POV orang ketiga/objektif).
    - JANGAN panggil pembaca dengan istilah formal seperti "Bapak/Ibu/Saudara".
    - JANGAN gunakan simbol markdown berat seperti '#' atau '***'. 
    - Gunakan format paragraf dengan jeda antar paragraf yang jelas.
    - Fokus pada poin-poin penting analisis data secara lugas.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, AI gagal menghasilkan kesimpulan untuk saat ini. Silakan coba lagi nanti.";
  }
}
