import axios from 'axios';


const ELEVEN_LABS_API_KEY = 'sk_c29480f0c8ceb561ad400589ac11fa3e186e130bb3d555a1';

const voice = '21m00Tcm4TlvDq8ikWAM';

export async function speakWithElevenLabs(text) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY
        },
        responseType: 'blob'
      }
    );

    const audioUrl = URL.createObjectURL(response.data);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error("❌ Error playing ElevenLabs voice:", err);
  }
}
