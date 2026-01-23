import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Transcribe audio file using OpenAI Whisper
 */
export async function transcribeAudio(
  audioFile: File | Buffer,
  filename: string
): Promise<{ transcription: string; confidence: number }> {
  try {
    const file = audioFile instanceof File ? audioFile : new File([new Uint8Array(audioFile)], filename)

    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    })

    return {
      transcription: transcription.text,
      confidence: (transcription as any).segments?.[0]?.avg_logprob
        ? Math.exp((transcription as any).segments[0].avg_logprob)
        : 0.8,
    }
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Transcribe audio from URL
 */
export async function transcribeAudioFromUrl(
  audioUrl: string
): Promise<{ transcription: string; confidence: number }> {
  try {
    // Fetch audio file
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const filename = audioUrl.split('/').pop() || 'audio.mp3'
    return await transcribeAudio(buffer, filename)
  } catch (error) {
    console.error('Error transcribing audio from URL:', error)
    throw new Error('Failed to transcribe audio from URL')
  }
}
