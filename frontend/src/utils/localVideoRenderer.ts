import type { ProductionBrief, ProductionJob, ProductionScene } from '../types/contracts'

interface Palette {
  background: string
  surface: string
  primary: string
  accent: string
  text: string
  muted: string
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 7) {
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
  return lines.slice(0, maxLines)
}

function paletteFor(brief: ProductionBrief): Palette {
  if (brief.visual_style === 'minimal') {
    return {
      background: '#f8fafc', surface: '#ffffff', primary: brief.primary_color,
      accent: brief.accent_color, text: '#111827', muted: '#64748b',
    }
  }
  if (brief.visual_style === 'technology') {
    return {
      background: '#07111f', surface: '#0f2138', primary: brief.primary_color,
      accent: brief.accent_color, text: '#f8fafc', muted: '#9fb3ca',
    }
  }
  return {
    background: '#16162a', surface: '#292947', primary: brief.primary_color,
    accent: brief.accent_color, text: '#ffffff', muted: '#d6d6e8',
  }
}

function dimensionsFor(aspectRatio: ProductionBrief['aspect_ratio']) {
  if (aspectRatio === '16:9') return { width: 1280, height: 720 }
  if (aspectRatio === '1:1') return { width: 960, height: 960 }
  return { width: 720, height: 1280 }
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function drawBackground(
  context: CanvasRenderingContext2D,
  brief: ProductionBrief,
  palette: Palette,
  progress: number,
  order: number,
) {
  const { width, height } = context.canvas
  context.fillStyle = palette.background
  context.fillRect(0, 0, width, height)

  if (brief.visual_style === 'minimal') {
    context.fillStyle = palette.primary
    context.fillRect(0, 0, width * 0.022, height)
    context.globalAlpha = 0.08
    context.fillStyle = palette.accent
    context.beginPath()
    context.arc(width * (0.8 + progress * 0.03), height * 0.16, width * 0.2, 0, Math.PI * 2)
    context.fill()
    context.globalAlpha = 1
    return
  }

  if (brief.visual_style === 'technology') {
    context.strokeStyle = 'rgba(255,255,255,.055)'
    context.lineWidth = 1
    const grid = Math.max(32, Math.round(Math.min(width, height) * 0.065))
    for (let x = -grid + ((progress * 16) % grid); x < width + grid; x += grid) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke()
    }
    for (let y = -grid + ((progress * 10) % grid); y < height + grid; y += grid) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke()
    }
  }

  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette.primary)
  gradient.addColorStop(1, palette.accent)
  context.globalAlpha = brief.visual_style === 'technology' ? 0.18 : 0.45
  context.fillStyle = gradient
  context.beginPath()
  context.arc(width * (0.78 + progress * 0.025), height * (0.16 + order * 0.012), width * 0.28, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(width * (0.12 - progress * 0.02), height * 0.86, width * 0.2, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1
}

function applyCameraMotion(context: CanvasRenderingContext2D, scene: ProductionScene, progress: number) {
  const { width, height } = context.canvas
  const eased = easeOutCubic(progress)
  if (scene.camera_motion === '快速推进') {
    const scale = 0.94 + eased * 0.08
    context.translate(width / 2, height / 2)
    context.scale(scale, scale)
    context.translate(-width / 2, -height / 2)
  } else if (scene.camera_motion === '缓慢横移') {
    context.translate((eased - 0.5) * width * 0.045, 0)
  } else if (scene.camera_motion === '分层上浮') {
    context.translate(0, (1 - eased) * height * 0.028)
  } else if (scene.camera_motion === '轻推定格') {
    const scale = 1 + Math.min(eased, 0.78) * 0.025
    context.translate(width / 2, height / 2)
    context.scale(scale, scale)
    context.translate(-width / 2, -height / 2)
  }
}

function transitionOpacity(scene: ProductionScene, progress: number) {
  if (scene.transition === '硬切') return 1
  const fadeIn = Math.min(1, progress / 0.1)
  const fadeOut = Math.min(1, (1 - progress) / 0.1)
  return Math.max(0, Math.min(fadeIn, fadeOut))
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: ProductionScene,
  brief: ProductionBrief,
  progress: number,
) {
  const { width, height } = context.canvas
  const palette = paletteFor(brief)
  const unit = Math.min(width, height)
  const margin = width * 0.075
  const contentWidth = width - margin * 2
  const landscape = width > height

  context.save()
  context.globalAlpha = transitionOpacity(scene, progress)
  applyCameraMotion(context, scene, progress)
  drawBackground(context, brief, palette, progress, scene.order)

  context.fillStyle = brief.visual_style === 'minimal' ? '#eef2ff' : 'rgba(255,255,255,.12)'
  context.fillRect(margin, height * 0.065, unit * 0.31, unit * 0.072)
  context.fillStyle = brief.visual_style === 'minimal' ? palette.primary : palette.text
  context.font = `700 ${Math.round(unit * 0.027)}px system-ui, sans-serif`
  context.fillText(`SCENE ${scene.order.toString().padStart(2, '0')} · ${scene.shot_type}`, margin + unit * 0.022, height * 0.108)

  const titleY = landscape ? height * 0.31 : height * 0.255
  context.fillStyle = palette.accent
  context.font = `800 ${Math.round(unit * 0.052)}px system-ui, sans-serif`
  context.fillText(scene.title, margin, titleY)

  context.fillStyle = palette.text
  context.font = `800 ${Math.round(unit * (landscape ? 0.062 : 0.073))}px system-ui, sans-serif`
  const narrationWidth = landscape ? width * 0.62 : contentWidth
  const narrationLines = wrapText(context, scene.narration, narrationWidth, landscape ? 4 : 7)
  const lineHeight = unit * (landscape ? 0.084 : 0.1)
  narrationLines.forEach((line, index) => {
    const reveal = Math.min(1, Math.max(0, progress * 1.7 - index * 0.08))
    context.globalAlpha = transitionOpacity(scene, progress) * reveal
    context.fillText(line, margin, titleY + unit * 0.13 + index * lineHeight)
  })
  context.globalAlpha = transitionOpacity(scene, progress)

  const visualY = landscape ? height * 0.76 : height * 0.775
  context.fillStyle = palette.surface
  context.globalAlpha *= brief.visual_style === 'minimal' ? 0.96 : 0.78
  context.fillRect(margin, visualY, contentWidth, height * 0.105)
  context.globalAlpha = transitionOpacity(scene, progress)
  context.fillStyle = palette.muted
  context.font = `500 ${Math.round(unit * 0.027)}px system-ui, sans-serif`
  const visualLines = wrapText(context, `画面设计 · ${scene.visual}`, contentWidth - unit * 0.06, 2)
  visualLines.forEach((line, index) => context.fillText(line, margin + unit * 0.03, visualY + unit * (0.052 + index * 0.04)))

  if (scene.order > 1) {
    context.fillStyle = palette.accent
    context.globalAlpha = 0.75 * transitionOpacity(scene, progress)
    context.fillRect(width * 0.89, height * 0.18, width * 0.018, height * Math.min(0.34, progress * 0.34))
  }

  context.globalAlpha = transitionOpacity(scene, progress)
  context.fillStyle = 'rgba(255,255,255,.16)'
  if (brief.visual_style === 'minimal') context.fillStyle = 'rgba(15,23,42,.12)'
  context.fillRect(margin, height * 0.925, contentWidth, Math.max(5, unit * 0.009))
  context.fillStyle = palette.accent
  context.fillRect(margin, height * 0.925, contentWidth * progress, Math.max(5, unit * 0.009))

  context.fillStyle = palette.muted
  context.font = `600 ${Math.round(unit * 0.023)}px system-ui, sans-serif`
  context.fillText(brief.brand_name, margin, height * 0.972)
  const footer = brief.ai_label ? 'AI 生成内容 · 本地制作' : '本地制作'
  const footerWidth = context.measureText(footer).width
  context.fillText(footer, width - margin - footerWidth, height * 0.972)
  context.restore()
}

function createSoundtrack(audioContext: AudioContext, destination: MediaStreamAudioDestinationNode) {
  const master = audioContext.createGain()
  master.gain.value = 0.028
  master.connect(destination)
  const oscillators = [
    { type: 'sine' as OscillatorType, ratio: 1, gain: 0.46 },
    { type: 'triangle' as OscillatorType, ratio: 1.5, gain: 0.18 },
    { type: 'sine' as OscillatorType, ratio: 2, gain: 0.1 },
  ].map((definition) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = definition.type
    gain.gain.value = definition.gain
    oscillator.connect(gain).connect(master)
    oscillator.start()
    return { oscillator, ratio: definition.ratio }
  })
  return {
    setScene(order: number) {
      const roots = [110, 123.47, 130.81, 146.83]
      const root = roots[(order - 1) % roots.length]
      oscillators.forEach(({ oscillator, ratio }) => {
        oscillator.frequency.setTargetAtTime(root * ratio, audioContext.currentTime, 0.18)
      })
    },
    accent() {
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.22)
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.07, audioContext.currentTime + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.32)
      oscillator.connect(gain).connect(master)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.34)
    },
    stop() {
      oscillators.forEach(({ oscillator }) => oscillator.stop())
    },
  }
}

export async function renderLocalVideo(job: ProductionJob, onProgress: (progress: number) => void) {
  if (!('MediaRecorder' in window)) throw new Error('当前浏览器不支持本地视频录制')
  if (job.scenes.length === 0) throw new Error('请先生成分镜再渲染视频')

  const canvas = document.createElement('canvas')
  const dimensions = dimensionsFor(job.brief.aspect_ratio)
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建视频画布')

  drawScene(context, job.scenes[0], job.brief, 0)
  const videoStream = canvas.captureStream(30)
  const audioContext = new AudioContext()
  await audioContext.resume()
  const destination = audioContext.createMediaStreamDestination()
  const soundtrack = createSoundtrack(audioContext, destination)
  const stream = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()])
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm'
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: job.brief.aspect_ratio === '16:9' ? 6_000_000 : 5_000_000,
    audioBitsPerSecond: 128_000,
  })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  const completed = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })
  recorder.start(500)

  const totalDuration = job.scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0)
  let elapsedDuration = 0
  for (const scene of job.scenes) {
    soundtrack.setScene(scene.order)
    soundtrack.accent()
    const milliseconds = scene.duration_seconds * 1000
    const startedAt = performance.now()
    while (performance.now() - startedAt < milliseconds) {
      const sceneProgress = Math.min(1, (performance.now() - startedAt) / milliseconds)
      drawScene(context, scene, job.brief, sceneProgress)
      onProgress(Math.round(((elapsedDuration + sceneProgress * scene.duration_seconds) / totalDuration) * 100))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    elapsedDuration += scene.duration_seconds
  }

  recorder.stop()
  const blob = await completed
  soundtrack.stop()
  stream.getTracks().forEach((track) => track.stop())
  await audioContext.close()
  onProgress(100)
  return blob
}
