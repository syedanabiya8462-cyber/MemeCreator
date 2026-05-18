'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AICaptionSuggestion } from './AICaptionSuggestion'
import { 
  Type, 
  Palette, 
  Filter, 
  Move, 
  Plus, 
  Trash2, 
  Undo2, 
  Redo2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Save,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TextBox {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  outline: boolean
  outlineColor: string
  shadow: boolean
  rotation: number
  bold: boolean
  italic: boolean
  textAlign: 'left' | 'center' | 'right'
}

interface MemeEditorProps {
  initialImage: string
  template?: any
  initialCaptions?: { top: string; bottom: string } | null
  initialAnimation?: string
  onSave: (imageUrl: string, captions: any) => Promise<void>
}

export function MemeEditor({ initialImage, template, initialCaptions, initialAnimation, onSave }: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([
    { 
      id: '1', 
      text: 'TOP TEXT', 
      x: 50, 
      y: 15, 
      fontSize: 48, 
      fontFamily: 'Impact', 
      color: '#FFFFFF', 
      outline: true,
      outlineColor: '#000000',
      shadow: true,
      rotation: 0,
      bold: true,
      italic: false,
      textAlign: 'center'
    },
    { 
      id: '2', 
      text: 'BOTTOM TEXT', 
      x: 50, 
      y: 85, 
      fontSize: 48, 
      fontFamily: 'Impact', 
      color: '#FFFFFF', 
      outline: true,
      outlineColor: '#000000',
      shadow: true,
      rotation: 0,
      bold: true,
      italic: false,
      textAlign: 'center'
    }
  ])
  const [selectedBox, setSelectedBox] = useState<string | null>('1')
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<TextBox[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  })
  const [animation, setAnimation] = useState<string>(initialAnimation || 'none')

  // Update animation if prop changes
  useEffect(() => {
    if (initialAnimation) {
      setAnimation(initialAnimation)
    }
  }, [initialAnimation])

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = initialImage
    img.onload = () => {
      setImage(img)
      drawCanvas()
    }
  }, [initialImage])

  // Load initialCaptions if provided
  useEffect(() => {
    if (initialCaptions) {
      setTextBoxes([
        { 
          id: '1', 
          text: initialCaptions.top || '', 
          x: 50, 
          y: 15, 
          fontSize: 48, 
          fontFamily: 'Impact', 
          color: '#FFFFFF', 
          outline: true,
          outlineColor: '#000000',
          shadow: true,
          rotation: 0,
          bold: true,
          italic: false,
          textAlign: 'center'
        },
        { 
          id: '2', 
          text: initialCaptions.bottom || '', 
          x: 50, 
          y: 85, 
          fontSize: 48, 
          fontFamily: 'Impact', 
          color: '#FFFFFF', 
          outline: true,
          outlineColor: '#000000',
          shadow: true,
          rotation: 0,
          bold: true,
          italic: false,
          textAlign: 'center'
        }
      ])
    }
  }, [initialCaptions])

  // Redraw when anything changes
  useEffect(() => {
    if (image) {
      drawCanvas()
    }
  }, [textBoxes, image, filters])

  const drawCanvas = () => {
    if (!canvasRef.current || !image) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = image.width
    canvas.height = image.height
    
    // Apply filters
    ctx.filter = `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
    `
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
    
    // Draw text boxes
    textBoxes.forEach(box => {
      ctx.save()
      
      const x = (box.x / 100) * canvas.width
      const y = (box.y / 100) * canvas.height
      
      ctx.translate(x, y)
      ctx.rotate((box.rotation * Math.PI) / 180)
      
      // Set font
      let fontStyle = ''
      if (box.bold) fontStyle += 'bold '
      if (box.italic) fontStyle += 'italic '
      fontStyle += `${box.fontSize}px ${box.fontFamily}`
      ctx.font = fontStyle
      
      ctx.textAlign = box.textAlign
      ctx.textBaseline = 'middle'
      
      // Measure text for bounding box (debug)
      const metrics = ctx.measureText(box.text)
      const textWidth = metrics.width
      const textHeight = box.fontSize
      
      // Draw outline
      if (box.outline) {
        ctx.strokeStyle = box.outlineColor
        ctx.lineWidth = 4
        ctx.strokeText(box.text, 0, 0)
      }
      
      // Draw shadow
      if (box.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }
      
      // Draw text
      ctx.fillStyle = box.color
      ctx.fillText(box.text, 0, 0)
      
      // Draw bounding box if selected
      if (selectedBox === box.id) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(
          -textWidth / 2 - 10,
          -textHeight / 2 - 5,
          textWidth + 20,
          textHeight + 10
        )
        ctx.setLineDash([])
      }
      
      ctx.restore()
    })
  }

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(textBoxes)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [textBoxes, history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTextBoxes(history[historyIndex - 1])
      toast.success('Undo')
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTextBoxes(history[historyIndex + 1])
      toast.success('Redo')
    }
  }

  const addTextBox = () => {
    const newBox: TextBox = {
      id: Date.now().toString(),
      text: 'NEW TEXT',
      x: 50,
      y: 50,
      fontSize: 40,
      fontFamily: 'Impact',
      color: '#FFFFFF',
      outline: true,
      outlineColor: '#000000',
      shadow: true,
      rotation: 0,
      bold: false,
      italic: false,
      textAlign: 'center'
    }
    setTextBoxes([...textBoxes, newBox])
    setSelectedBox(newBox.id)
    saveToHistory()
  }

  const deleteTextBox = () => {
    if (selectedBox && textBoxes.length > 1) {
      setTextBoxes(textBoxes.filter(box => box.id !== selectedBox))
      setSelectedBox(textBoxes[0].id)
      saveToHistory()
    } else {
      toast.error('Cannot delete the last text box')
    }
  }

  const updateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(textBoxes.map(box => 
      box.id === id ? { ...box, ...updates } : box
    ))
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !canvasRef.current) return
    
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    
    // Find clicked text box
    for (let i = textBoxes.length - 1; i >= 0; i--) {
      const box = textBoxes[i]
      const x = (box.x / 100) * canvasRef.current.width
      const y = (box.y / 100) * canvasRef.current.height
      
      // Simple bounding box check
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.font = `${box.bold ? 'bold ' : ''}${box.italic ? 'italic ' : ''}${box.fontSize}px ${box.fontFamily}`
        const metrics = ctx.measureText(box.text)
        const textWidth = metrics.width
        const textHeight = box.fontSize
        
        if (Math.abs(canvasX - x) < textWidth / 2 + 20 && 
            Math.abs(canvasY - y) < textHeight / 2 + 20) {
          setSelectedBox(box.id)
          setDragging(true)
          setDragOffset({ x: canvasX - x, y: canvasY - y })
          break
        }
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !selectedBox || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    let canvasX = (e.clientX - rect.left) * scaleX
    let canvasY = (e.clientY - rect.top) * scaleY
    
    canvasX = canvasX - dragOffset.x
    canvasY = canvasY - dragOffset.y
    
    const percentX = (canvasX / canvasRef.current.width) * 100
    const percentY = (canvasY / canvasRef.current.height) * 100
    
    updateTextBox(selectedBox, { 
      x: Math.min(95, Math.max(5, percentX)),
      y: Math.min(95, Math.max(5, percentY))
    })
  }

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false)
      saveToHistory()
    }
  }

  const exportImage = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `meme-${Date.now()}.png`
    link.href = dataUrl
    link.click()
    toast.success('Meme downloaded!')
    return dataUrl
  }

  const handleSave = async () => {
    if (!canvasRef.current) return
    
    const imageDataUrl = canvasRef.current.toDataURL('image/png')
    const blob = await fetch(imageDataUrl).then(res => res.blob())
    
    // Extract captions for saving
    const captions = textBoxes.map(box => ({
      text: box.text,
      position: { x: box.x, y: box.y },
      style: {
        fontSize: box.fontSize,
        fontFamily: box.fontFamily,
        color: box.color,
        outline: box.outline,
        shadow: box.shadow
      }
    }))
    
    await onSave(imageDataUrl, captions)
  }

  const selectedBoxData = textBoxes.find(box => box.id === selectedBox)

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Canvas Area */}
      <div className="flex-1" ref={containerRef}>
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              "border-2 rounded-lg shadow-xl cursor-move mx-auto",
              animation === 'pulse' && "animate-pulse",
              animation === 'bounce' && "animate-bounce",
              animation === 'spin' && "animate-spin"
            )}
            style={{ width: '100%', maxWidth: '600px', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }}
          />
        </div>
        
        {/* Toolbar */}
        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={addTextBox}>
            <Plus className="w-4 h-4 mr-1" />
            Add Text
          </Button>
          {selectedBox && (
            <Button variant="outline" size="sm" onClick={deleteTextBox}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportImage}>
            Download PNG
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Meme
          </Button>
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="lg:w-96 space-y-4">
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
              <Type className="w-4 h-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Captions
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            {selectedBoxData ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Text</label>
                  <Input
                    value={selectedBoxData.text}
                    onChange={(e) => updateTextBox(selectedBox!, { text: e.target.value })}
                    placeholder="Enter text"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Size</label>
                  <Slider
                    value={[selectedBoxData.fontSize]}
                    onValueChange={([value]) => updateTextBox(selectedBox!, { fontSize: value })}
                    min={16}
                    max={120}
                    step={1}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Family</label>
                  <select
                    value={selectedBoxData.fontFamily}
                    onChange={(e) => updateTextBox(selectedBox!, { fontFamily: e.target.value })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Impact">Impact</option>
                    <option value="Arial">Arial</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Text Color</label>
                  <Input
                    type="color"
                    value={selectedBoxData.color}
                    onChange={(e) => updateTextBox(selectedBox!, { color: e.target.value })}
                    className="w-full h-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={selectedBoxData.bold ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTextBox(selectedBox!, { bold: !selectedBoxData.bold })}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedBoxData.italic ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTextBox(selectedBox!, { italic: !selectedBoxData.italic })}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedBoxData.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTextBox(selectedBox!, { textAlign: 'left' })}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedBoxData.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTextBox(selectedBox!, { textAlign: 'center' })}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedBoxData.textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTextBox(selectedBox!, { textAlign: 'right' })}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={selectedBoxData.outline ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateTextBox(selectedBox!, { outline: !selectedBoxData.outline })}
                  >
                    Outline
                  </Button>
                  <Button
                    variant={selectedBoxData.shadow ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateTextBox(selectedBox!, { shadow: !selectedBoxData.shadow })}
                  >
                    Shadow
                  </Button>
                </div>
                
                {selectedBoxData.outline && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Outline Color</label>
                    <Input
                      type="color"
                      value={selectedBoxData.outlineColor}
                      onChange={(e) => updateTextBox(selectedBox!, { outlineColor: e.target.value })}
                      className="w-full h-10"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Rotation: {selectedBoxData.rotation}°</label>
                  <Slider
                    value={[selectedBoxData.rotation]}
                    onValueChange={([value]) => updateTextBox(selectedBox!, { rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a text box to edit
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ai">
            <AICaptionSuggestion
              template={template}
              onSelectCaption={(caption: any) => {
                if (textBoxes[0]) {
                  updateTextBox(textBoxes[0].id, { text: caption.top || caption })
                }
                if (textBoxes[1] && caption.bottom) {
                  updateTextBox(textBoxes[1].id, { text: caption.bottom })
                }
                saveToHistory()
              }}
            />
          </TabsContent>
          
          <TabsContent value="filters" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Brightness: {filters.brightness}%</label>
              <Slider
                value={[filters.brightness]}
                onValueChange={([value]) => setFilters({ ...filters, brightness: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Contrast: {filters.contrast}%</label>
              <Slider
                value={[filters.contrast]}
                onValueChange={([value]) => setFilters({ ...filters, contrast: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Saturation: {filters.saturation}%</label>
              <Slider
                value={[filters.saturation]}
                onValueChange={([value]) => setFilters({ ...filters, saturation: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Blur: {filters.blur}px</label>
              <Slider
                value={[filters.blur]}
                onValueChange={([value]) => setFilters({ ...filters, blur: value })}
                min={0}
                max={20}
                step={0.5}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Animation (Web Only)</label>
              <select
                value={animation}
                onChange={(e) => setAnimation(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="none">None</option>
                <option value="pulse">Pulse</option>
                <option value="bounce">Bounce</option>
                <option value="spin">Spin</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Animations only play in the browser and will not be saved in the downloaded PNG.
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
                setAnimation('none')
              }}
            >
              Reset Filters & Animation
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}