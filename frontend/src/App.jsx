import { useCallback, useEffect, useMemo, useState } from "react"
import { useDropzone } from "react-dropzone"
import {
  Activity,
  Brain,
  CheckCircle,
  Files,
  FileText,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Minimize2,
  Moon,
  RotateCw,
  ScanText,
  Scissors,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react"

function App() {
  const API = "http://127.0.0.1:8000"

  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [message, setMessage] = useState("Ready")
  const [history, setHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const [mergeFiles, setMergeFiles] = useState([])
  const [singlePdf, setSinglePdf] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [rotateAngle, setRotateAngle] = useState("90")
  const [deletePages, setDeletePages] = useState("")
  const [compressQuality, setCompressQuality] = useState("screen")

  const [aiFile, setAiFile] = useState(null)
  const [aiSummary, setAiSummary] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const [chatFile, setChatFile] = useState(null)
  const [chatQuestion, setChatQuestion] = useState("")
  const [chatAnswer, setChatAnswer] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const [ocrFile, setOcrFile] = useState(null)
  const [ocrText, setOcrText] = useState("")
  const [ocrSummary, setOcrSummary] = useState("")
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("atlas_theme")
    const savedHistory = localStorage.getItem("atlas_history")

    if (savedTheme === "dark") setDarkMode(true)
    if (savedHistory) setHistory(JSON.parse(savedHistory))
  }, [])

  const theme = {
    page: darkMode ? "bg-slate-950" : "bg-slate-100",
    sidebar: darkMode ? "bg-black" : "bg-slate-950",
    card: darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
    soft: darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200",
    input: darkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-800",
    text: darkMode ? "text-white" : "text-slate-900",
    muted: darkMode ? "text-slate-400" : "text-slate-500",
    file: darkMode ? "bg-slate-950 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-700",
    icon: darkMode ? "text-white" : "text-slate-700",
  }

  const selectedFilesCount =
    mergeFiles.length +
    imageFiles.length +
    (singlePdf ? 1 : 0) +
    (aiFile ? 1 : 0) +
    (chatFile ? 1 : 0) +
    (ocrFile ? 1 : 0)

  const visibleToolsCount = 10

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB"
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getTotalSize = (files) => {
    if (!files || files.length === 0) return "0 MB"
    return formatFileSize(files.reduce((sum, file) => sum + file.size, 0))
  }

  const addHistory = (text) => {
    const newHistory = [
      {
        text,
        time: new Date().toLocaleTimeString(),
      },
      ...history,
    ].slice(0, 20)

    setHistory(newHistory)
    localStorage.setItem("atlas_history", JSON.stringify(newHistory))
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem("atlas_theme", next ? "dark" : "light")
  }

  const downloadBlob = async (response, filename) => {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)
  }

  const downloadTextFile = (text, filename) => {
    if (!text) {
      setMessage("Nothing to download")
      return
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)
  }

  const copyText = async (text, successMessage) => {
    if (!text) {
      setMessage("Nothing to copy")
      return
    }

    await navigator.clipboard.writeText(text)
    setMessage(successMessage)
    addHistory(successMessage)
  }

  const callTool = async (endpoint, formData, filename, successMessage) => {
    try {
      setMessage("Processing...")

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || "Tool failed")
      }

      await downloadBlob(response, filename)

      setMessage(successMessage)
      addHistory(successMessage)
    } catch (error) {
      console.error(error)
      setMessage(`Failed: ${error.message}`)
    }
  }

  const DropArea = ({ files, onDrop, onClear, multiple = false, accept = {} }) => {
    const dropHandler = useCallback(
      (acceptedFiles) => {
        onDrop(acceptedFiles)
      },
      [onDrop]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: dropHandler,
      multiple,
      accept,
    })

    return (
      <div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : darkMode
              ? "border-slate-700 bg-slate-950"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <input {...getInputProps()} />

          <p className={darkMode ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>
            Drag & Drop files here
          </p>

          <p className="text-slate-400 text-sm mt-2">or click to browse</p>
        </div>

        {files?.length > 0 && (
          <div className={`mt-4 border rounded-2xl p-4 ${theme.soft}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm ${theme.muted}`}>
              <span>
                Selected Files: <b>{files.length}</b>
              </span>

              <span>
                Total Size: <b>{getTotalSize(files)}</b>
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${theme.file}`}
                >
                  <span className="truncate text-sm">{file.name}</span>
                  <span className="text-slate-400 text-xs whitespace-nowrap">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClear}
              className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-sm"
            >
              Clear Selected Files
            </button>
          </div>
        )}
      </div>
    )
  }

  const mergePDF = () => {
    if (mergeFiles.length < 2) return setMessage("Select at least 2 PDFs")

    const formData = new FormData()
    mergeFiles.forEach((file) => formData.append("files", file))

    callTool("/merge-pdf", formData, "merged_output.pdf", "PDF merged successfully")
  }

  const splitPDF = () => {
    if (!singlePdf) return setMessage("Select one PDF")

    const formData = new FormData()
    formData.append("file", singlePdf)

    callTool("/split-pdf", formData, "split_pages.zip", "PDF split successfully")
  }

  const jpgToPDF = () => {
    if (imageFiles.length < 1) return setMessage("Select images")

    const formData = new FormData()
    imageFiles.forEach((file) => formData.append("files", file))

    callTool("/jpg-to-pdf", formData, "images_to_pdf.pdf", "Images converted to PDF")
  }

  const compressPDF = () => {
    if (!singlePdf) return setMessage("Select one PDF")

    const formData = new FormData()
    formData.append("file", singlePdf)

    callTool("/compress-pdf", formData, "compressed.pdf", "PDF compressed successfully")
  }

  const extremeCompressPDF = () => {
    if (!singlePdf) return setMessage("Select one PDF")

    const formData = new FormData()
    formData.append("file", singlePdf)
    formData.append("quality", compressQuality)

    callTool(
      "/extreme-compress-pdf",
      formData,
      `extreme_compressed_${compressQuality}.pdf`,
      `Extreme compression completed (${compressQuality})`
    )
  }

  const rotatePDF = () => {
    if (!singlePdf) return setMessage("Select one PDF")

    const formData = new FormData()
    formData.append("file", singlePdf)
    formData.append("angle", rotateAngle)

    callTool("/rotate-pdf", formData, "rotated.pdf", "PDF rotated successfully")
  }

  const deletePDFPages = () => {
    if (!singlePdf) return setMessage("Select one PDF")
    if (!deletePages.trim()) return setMessage("Enter pages like 1,3,5")

    const formData = new FormData()
    formData.append("file", singlePdf)
    formData.append("pages", deletePages)

    callTool("/delete-pages", formData, "pages_deleted.pdf", "Pages deleted successfully")
  }

  const generateAISummary = async () => {
    if (!aiFile) return setMessage("Select PDF for AI Summary")

    try {
      setAiLoading(true)
      setAiSummary("")
      setMessage("Generating AI Summary...")

      const formData = new FormData()
      formData.append("file", aiFile)

      const response = await fetch(`${API}/ai-summary`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || "AI Summary failed")

      setAiSummary(data.summary)
      setMessage("AI Summary generated")
      addHistory("AI Summary generated")
    } catch (error) {
      console.error(error)
      setAiSummary(`Error: ${error.message}`)
      setMessage("AI Summary failed")
    } finally {
      setAiLoading(false)
    }
  }

  const askPDF = async () => {
    if (!chatFile) return setMessage("Select PDF for Chat")
    if (!chatQuestion.trim()) return setMessage("Enter question")

    try {
      setChatLoading(true)
      setChatAnswer("")
      setMessage("Asking PDF...")

      const formData = new FormData()
      formData.append("file", chatFile)
      formData.append("question", chatQuestion)

      const response = await fetch(`${API}/chat-pdf`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || "Chat PDF failed")

      setChatAnswer(data.answer)
      setMessage("PDF answer generated")
      addHistory("PDF answer generated")
    } catch (error) {
      console.error(error)
      setChatAnswer(`Error: ${error.message}`)
      setMessage("Chat PDF failed")
    } finally {
      setChatLoading(false)
    }
  }

  const extractOCR = async () => {
    if (!ocrFile) return setMessage("Select image for OCR")

    try {
      setOcrLoading(true)
      setOcrText("")
      setMessage("Extracting OCR text...")

      const formData = new FormData()
      formData.append("file", ocrFile)

      const response = await fetch(`${API}/ocr-image`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || "OCR failed")

      setOcrText(data.text)
      setMessage("OCR text extracted")
      addHistory("OCR text extracted")
    } catch (error) {
      console.error(error)
      setOcrText(`Error: ${error.message}`)
      setMessage("OCR failed")
    } finally {
      setOcrLoading(false)
    }
  }

  const aiOCRSummary = async () => {
    if (!ocrFile) return setMessage("Select image for AI OCR Summary")

    try {
      setOcrLoading(true)
      setOcrText("")
      setOcrSummary("")
      setMessage("Generating AI OCR Summary...")

      const formData = new FormData()
      formData.append("file", ocrFile)

      const response = await fetch(`${API}/ai-ocr-summary`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || "AI OCR failed")

      setOcrText(data.ocr_text)
      setOcrSummary(data.summary)
      setMessage("AI OCR Summary generated")
      addHistory("AI OCR Summary generated")
    } catch (error) {
      console.error(error)
      setOcrSummary(`Error: ${error.message}`)
      setMessage("AI OCR failed")
    } finally {
      setOcrLoading(false)
    }
  }

  const StatCard = ({ title, value, icon }) => (
    <div className={`rounded-3xl p-5 sm:p-6 border shadow-sm ${theme.card}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs sm:text-sm">{title}</p>
          <h3 className={`text-xl sm:text-3xl font-bold mt-2 break-words ${theme.text}`}>
            {value}
          </h3>
        </div>

        <div className={darkMode ? "bg-slate-800 p-3 sm:p-4 rounded-2xl" : "bg-slate-100 p-3 sm:p-4 rounded-2xl"}>
          {icon}
        </div>
      </div>
    </div>
  )

  const ResultBox = ({ text, title, copyLabel, downloadName, clearAction }) => {
    if (!text) return null

    return (
      <div className={`mt-6 border rounded-2xl p-5 ${theme.soft}`}>
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={() => copyText(text, `${title} copied`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            {copyLabel}
          </button>

          <button
            onClick={() => downloadTextFile(text, downloadName)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            Download TXT
          </button>

          <button
            onClick={clearAction}
            className="bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-xl text-sm"
          >
            Clear
          </button>
        </div>

        <div className={`whitespace-pre-wrap leading-7 text-sm sm:text-base ${theme.text}`}>{text}</div>
      </div>
    )
  }

  const ToolCard = ({ title, description, icon, children }) => {
    const visible = `${title} ${description}`.toLowerCase().includes(searchQuery.toLowerCase())

    if (!visible) return null

    return (
      <section className={`rounded-3xl shadow-sm border p-5 sm:p-6 ${theme.card}`}>
        <div className="flex items-center gap-3">
          <div className={darkMode ? "bg-slate-800 p-3 rounded-2xl" : "bg-slate-100 p-3 rounded-2xl"}>
            {icon}
          </div>

          <div>
            <h3 className={`text-lg sm:text-xl font-bold ${theme.text}`}>{title}</h3>
            <p className={`text-xs sm:text-sm mt-1 ${theme.muted}`}>{description}</p>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </section>
    )
  }

  const Sidebar = () => (
    <aside className={`w-72 text-white p-8 ${theme.sidebar} ${mobileMenu ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">ATLAS</h1>
          <p className="text-slate-400 mt-2">Agency Operating System</p>
        </div>

        <button onClick={() => setMobileMenu(false)} className="lg:hidden">
          <X />
        </button>
      </div>

      <nav className="mt-12 space-y-3">
        <div className="bg-blue-600 rounded-2xl px-5 py-4">🏠 Dashboard</div>
        <div className="px-5 py-4 hover:bg-slate-800 rounded-2xl cursor-pointer">📄 PDF Tools</div>
        <div className="px-5 py-4 hover:bg-slate-800 rounded-2xl cursor-pointer">🤖 AI Tools</div>
        <div className="px-5 py-4 hover:bg-slate-800 rounded-2xl cursor-pointer">🎥 Video Tools</div>
      </nav>
    </aside>
  )

  const tools = useMemo(() => visibleToolsCount, [])

  return (
    <div className={`min-h-screen flex ${theme.page}`}>
      <Sidebar />

      {mobileMenu && (
        <div
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-10 overflow-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className={`lg:hidden p-3 rounded-2xl border ${theme.card}`}
            >
              <Menu className={theme.icon} />
            </button>

            <div>
              <h2 className={`text-3xl sm:text-5xl font-bold ${theme.text}`}>Atlas Dashboard</h2>
              <p className={`mt-2 sm:mt-3 text-sm sm:text-lg ${theme.muted}`}>
                PDF + AI + OCR workflow system
              </p>
            </div>
          </div>

          <button
            onClick={toggleDarkMode}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2 border w-fit ${
              darkMode
                ? "bg-white text-slate-900 border-white"
                : "bg-slate-900 text-white border-slate-900"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mt-8">
          <StatCard title="TOTAL TOOLS" value={tools} icon={<Wrench className={theme.icon} />} />
          <StatCard title="COMPLETED" value={history.length} icon={<CheckCircle className={theme.icon} />} />
          <StatCard title="SELECTED FILES" value={selectedFilesCount} icon={<Files className={theme.icon} />} />
          <StatCard title="STATUS" value={message} icon={<Activity className={theme.icon} />} />
        </div>

        <div className={`mt-6 sm:mt-8 rounded-3xl p-5 sm:p-6 border ${theme.card}`}>
          <div className="flex items-center gap-3">
            <Search className="text-slate-400" />

            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full outline-none text-sm sm:text-base ${
                darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-700"
              }`}
            />
          </div>
        </div>

        <div className={`mt-6 rounded-3xl p-5 sm:p-6 border ${theme.card}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm">RECENT ACTIVITY</p>
              <h3 className={`text-xl sm:text-2xl font-semibold mt-1 ${theme.text}`}>Tool History</h3>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("atlas_history")
                setHistory([])
              }}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
              Clear
            </button>
          </div>

          <div className="mt-5 space-y-3 max-h-64 overflow-auto">
            {history.length === 0 && <div className="text-slate-400">No activity yet</div>}

            {history.map((item, index) => (
              <div key={index} className={`border rounded-2xl p-4 ${theme.soft}`}>
                <div className={`font-medium ${theme.text}`}>{item.text}</div>
                <div className="text-sm text-slate-400 mt-1">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 mt-8">
          <ToolCard title="Merge PDF" description="Combine multiple PDFs into one." icon={<FileText className={theme.icon} />}>
            <DropArea
              multiple
              accept={{ "application/pdf": [".pdf"] }}
              files={mergeFiles}
              onDrop={setMergeFiles}
              onClear={() => setMergeFiles([])}
            />
            <button onClick={mergePDF} className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl">
              Merge PDFs
            </button>
          </ToolCard>

          <ToolCard title="Split PDF" description="Extract all pages separately." icon={<Scissors className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={singlePdf ? [singlePdf] : []}
              onDrop={(files) => setSinglePdf(files[0])}
              onClear={() => setSinglePdf(null)}
            />
            <button onClick={splitPDF} className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl">
              Split PDF
            </button>
          </ToolCard>

          <ToolCard title="JPG / PNG to PDF" description="Convert images into one PDF." icon={<ImageIcon className={theme.icon} />}>
            <DropArea
              multiple
              accept={{ "image/*": [] }}
              files={imageFiles}
              onDrop={setImageFiles}
              onClear={() => setImageFiles([])}
            />
            <button onClick={jpgToPDF} className="mt-5 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl">
              Convert to PDF
            </button>
          </ToolCard>

          <ToolCard title="Compress PDF" description="Basic PDF compression." icon={<Minimize2 className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={singlePdf ? [singlePdf] : []}
              onDrop={(files) => setSinglePdf(files[0])}
              onClear={() => setSinglePdf(null)}
            />
            <button onClick={compressPDF} className="mt-5 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl">
              Compress PDF
            </button>
          </ToolCard>

          <ToolCard title="Extreme Compress PDF" description="Ultra compression using Ghostscript." icon={<Zap className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={singlePdf ? [singlePdf] : []}
              onDrop={(files) => setSinglePdf(files[0])}
              onClear={() => setSinglePdf(null)}
            />

            <select
              value={compressQuality}
              onChange={(e) => setCompressQuality(e.target.value)}
              className={`mt-4 block w-full border rounded-2xl p-4 ${theme.input}`}
            >
              <option value="screen">Screen - Smallest Size</option>
              <option value="ebook">Ebook - Balanced</option>
              <option value="printer">Printer - Better Quality</option>
              <option value="prepress">Prepress - High Quality</option>
            </select>

            <button onClick={extremeCompressPDF} className="mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl">
              Extreme Compress PDF
            </button>
          </ToolCard>

          <ToolCard title="Rotate PDF" description="Rotate all pages." icon={<RotateCw className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={singlePdf ? [singlePdf] : []}
              onDrop={(files) => setSinglePdf(files[0])}
              onClear={() => setSinglePdf(null)}
            />

            <select
              value={rotateAngle}
              onChange={(e) => setRotateAngle(e.target.value)}
              className={`mt-4 block w-full border rounded-2xl p-4 ${theme.input}`}
            >
              <option value="90">90 Degrees</option>
              <option value="180">180 Degrees</option>
              <option value="270">270 Degrees</option>
            </select>

            <button onClick={rotatePDF} className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl">
              Rotate PDF
            </button>
          </ToolCard>

          <ToolCard title="Delete PDF Pages" description="Delete pages like 1,3,5." icon={<Trash2 className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={singlePdf ? [singlePdf] : []}
              onDrop={(files) => setSinglePdf(files[0])}
              onClear={() => setSinglePdf(null)}
            />

            <input
              type="text"
              placeholder="Example: 1,3,5"
              value={deletePages}
              onChange={(e) => setDeletePages(e.target.value)}
              className={`mt-4 block w-full border rounded-2xl p-4 ${theme.input}`}
            />

            <button onClick={deletePDFPages} className="mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl">
              Delete Pages
            </button>
          </ToolCard>

          <ToolCard title="AI PDF Summary" description="Generate AI summary from PDF." icon={<Sparkles className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={aiFile ? [aiFile] : []}
              onDrop={(files) => setAiFile(files[0])}
              onClear={() => {
                setAiFile(null)
                setAiSummary("")
              }}
            />

            <button
              onClick={generateAISummary}
              disabled={aiLoading}
              className="mt-5 bg-black hover:bg-slate-800 text-white px-6 py-3 rounded-2xl disabled:bg-slate-400"
            >
              {aiLoading ? "Generating..." : "Generate AI Summary"}
            </button>

            <ResultBox
              text={aiSummary}
              title="AI Summary"
              copyLabel="Copy Summary"
              downloadName="ai_summary.txt"
              clearAction={() => setAiSummary("")}
            />
          </ToolCard>

          <ToolCard title="Chat With PDF" description="Ask questions from uploaded PDF." icon={<MessageSquare className={theme.icon} />}>
            <DropArea
              accept={{ "application/pdf": [".pdf"] }}
              files={chatFile ? [chatFile] : []}
              onDrop={(files) => setChatFile(files[0])}
              onClear={() => {
                setChatFile(null)
                setChatQuestion("")
                setChatAnswer("")
              }}
            />

            <textarea
              placeholder="Ask something from this PDF..."
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              className={`mt-4 block w-full border rounded-2xl p-4 min-h-[120px] ${theme.input}`}
            />

            <button
              onClick={askPDF}
              disabled={chatLoading}
              className="mt-5 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl disabled:bg-slate-400"
            >
              {chatLoading ? "Thinking..." : "Ask PDF"}
            </button>

            <ResultBox
              text={chatAnswer}
              title="PDF Answer"
              copyLabel="Copy Answer"
              downloadName="pdf_answer.txt"
              clearAction={() => setChatAnswer("")}
            />
          </ToolCard>

          <ToolCard title="OCR Image Scanner" description="Extract text from image documents." icon={<ScanText className={theme.icon} />}>
            <DropArea
              accept={{ "image/*": [] }}
              files={ocrFile ? [ocrFile] : []}
              onDrop={(files) => setOcrFile(files[0])}
              onClear={() => {
                setOcrFile(null)
                setOcrText("")
                setOcrSummary("")
              }}
            />

            <button
              onClick={extractOCR}
              disabled={ocrLoading}
              className="mt-5 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-2xl disabled:bg-slate-400"
            >
              {ocrLoading ? "Reading..." : "Extract OCR Text"}
            </button>

            <ResultBox
              text={ocrText}
              title="OCR Text"
              copyLabel="Copy OCR"
              downloadName="ocr_text.txt"
              clearAction={() => setOcrText("")}
            />
          </ToolCard>

          <ToolCard title="AI + OCR Summary" description="Extract image text and summarize with AI." icon={<Brain className={theme.icon} />}>
            <DropArea
              accept={{ "image/*": [] }}
              files={ocrFile ? [ocrFile] : []}
              onDrop={(files) => setOcrFile(files[0])}
              onClear={() => {
                setOcrFile(null)
                setOcrText("")
                setOcrSummary("")
              }}
            />

            <button
              onClick={aiOCRSummary}
              disabled={ocrLoading}
              className="mt-5 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl disabled:bg-slate-400"
            >
              {ocrLoading ? "Generating..." : "Generate AI OCR Summary"}
            </button>

            <ResultBox
              text={ocrSummary}
              title="AI OCR Summary"
              copyLabel="Copy Summary"
              downloadName="ai_ocr_summary.txt"
              clearAction={() => setOcrSummary("")}
            />
          </ToolCard>
        </div>
      </main>
    </div>
  )
}

export default App