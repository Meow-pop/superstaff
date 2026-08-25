import type { ProductionJob, ProductionScene } from '../types/contracts'

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  let current = ''
  for (const character of text) {
    const next = current + character
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = character
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 7)
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: ProductionScene,
  progress: number,
) {
  const width = context.canvas.width
  const height = context.canvas.height
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#292352')
  gradient.addColorStop(0.55, '#5c4fc0')
  gradient.addColorStop(1, '#287aa0')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.globalAlpha = 0.15
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(width * 0.82, height * 0.16, 210 + progress * 30, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(width * 0.16, height * 0.82, 150, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  context.fillStyle = 'rgba(255,255,255,.16)'
  context.fillRect(54, 75, 150, 52)
  context.fillStyle = '#ffffff'
  context.font = '600 24px sans-serif'
  context.fillText(`SUPERSTAFF · ${scene.order.toString().padStart(2, '0')}`, 70, 109)

  context.fillStyle = '#d8d4ff'
  context.font = '700 38px sans-serif'
  context.fillText(scene.title, 58, 285)

  context.fillStyle = '#ffffff'
  context.font = '700 54px sans-serif'
  const lines = wrapText(context, scene.narration, width - 116)
  lines.forEach((line, index) => context.fillText(line, 58, 390 + index * 76))

  context.fillStyle = 'rgba(255,255,255,.78)'
  context.font = '28px sans-serif'
  wrapText(context, `画面建议：${scene.visual}`, width - 116).slice(0, 3).forEach(
    (line, index) => context.fillText(line, 58, 990 + index * 44),
  )

  context.fillStyle = 'rgba(255,255,255,.22)'
  context.fillRect(58, 1195, width - 116, 8)
  context.fillStyle = '#ffffff'
  context.fillRect(58, 1195, (width - 116) * progress, 8)
  context.font = '24px sans-serif'
  context.fillText('熠企超级员工 · 本地演示渲染', 58, 1247)
}

export async function renderLocalVideo(
  job: ProductionJob,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  if (!('MediaRecorder' in window)) throw new Error('当前浏览器不支持本地视频录制')
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 1280
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建视频画布')

  const videoStream = canvas.captureStream(30)
  const AudioContextClass = window.AudioContext
  const audioContext = new AudioContextClass()
  const destination = audioContext.createMediaStreamDestination()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  gain.gain.value = 0.018
  oscillator.type = 'sine'
  oscillator.connect(gain).connect(destination)
  oscillator.start()

  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ])
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_400_000 })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  const completed = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })
  recorder.start(250)

  const scenes = job.scenes.length > 0 ? job.scenes : []
  const millisecondsPerScene = 1150
  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex]
    oscillator.frequency.setValueAtTime(160 + sceneIndex * 28, audioContext.currentTime)
    const startedAt = performance.now()
    while (performance.now() - startedAt < millisecondsPerScene) {
      const sceneProgress = Math.min(1, (performance.now() - startedAt) / millisecondsPerScene)
      drawScene(context, scene, sceneProgress)
      onProgress(Math.round(((sceneIndex + sceneProgress) / scenes.length) * 100))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  }

  recorder.stop()
  const blob = await completed
  oscillator.stop()
  stream.getTracks().forEach((track) => track.stop())
  await audioContext.close()
  onProgress(100)
  return blob
}
