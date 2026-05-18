import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import {
  FileText,
  Scissors,
  Image as ImageIcon,
  Minimize2,
  RotateCw,
  Trash2,
  Search,
  Wrench,
  CheckCircle,
  Files,
  Activity,
  Sparkles,
  MessageSquare,
  Moon,
  Sun,
  ScanText,
  Brain,
  Zap,
} from "lucide-react"

function App() {
  const API = "http://127.0.0.1:8000"

  const [darkMode, setDarkMode] = useState(false)
  const [message, setMessage] = useState("Ready")
  const [history, setHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const [mergeFiles, setMergeFiles] = useState([])
  const [singlePdf, setSinglePdf] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [rotateAngle, setRotateAngle] = useState(90)
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
    const savedHistory = localStorage.getItem("atlas_history")
    const savedTheme = localStorage.getItem("atlas_theme")

    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedTheme === "dark") setDarkMode(true)
  }, [])

  const theme = {
    page: darkMode ? "bg-slate-950" : "bg-slate-100",
    sidebar: darkMode ? "bg-black" : "bg-slate-950",
    card: darkMode
      ? "bg-slate-900 border-slate-800"
      : "bg-white border-slate-200",
    cardSoft: darkMode
      ? "bg-slate-800 border-slate-700"
      : "bg-slate-50 border-slate-200",
    text: darkMode ? "text-white" : "text-slate-900",
    muted: darkMode ? "text-slate-400" : "text-slate-500",
    input: darkMode
      ? "bg-slate-950 border-slate-700 text-white"
      : "bg-white border-slate-300 text-slate-700",
    fileBox: darkMode
      ? "bg-slate-950 border-slate-700 text-slate-300"
      : "bg-white border-slate-200 text-slate-700",
  }

  const selectedFilesCount =
    mergeFiles.length +
    imageFiles.length +
    (singlePdf ? 1 : 0) +
    (aiFile ? 1 : 0) +
    (chatFile ? 1 : 0) +
    (ocrFile ? 1 : 0)

  const iconClass = darkMode ? "text-white" : "text-slate-700"

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB"
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getTotalSize = (files) => {
    if (!files || files.length === 0) return "0 MB"

    return formatFileSize(
      files.reduce((sum, file) => sum + file.size, 0)
    )
  }

  const toggleDarkMode = () => {
    const nextMode = !darkMode

    setDarkMode(nextMode)

    localStorage.setItem(
      "atlas_theme",
      nextMode ? "dark" : "light"
    )
  }

  const addHistory = (text) => {
    const newHistory = [
      {
        text,
        time: new Date().toLocaleTimeString(),
      },
      ...history,
    ]

    setHistory(newHistory)

    localStorage.setItem(
      "atlas_history",
      JSON.stringify(newHistory)
    )
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
    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    })

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

  const callTool = async (
    endpoint,
    formData,
    filename,
    successMessage
  ) => {
    try {
      setMessage("Processing...")

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Tool failed")
      }

      await downloadBlob(response, filename)

      setMessage(successMessage)

      addHistory(successMessage)
    } catch (error) {
      console.error(error)
      setMessage("Operation failed")
    }
  }

  const DropArea = ({
    onDrop,
    onClear,
    multiple = false,
    accept = {},
    files,
  }) => {
    const dropHandler = useCallback(
      (acceptedFiles) => {
        onDrop(acceptedFiles)
      },
      [onDrop]
    )

    const {
      getRootProps,
      getInputProps,
      isDragActive,
    } = useDropzone({
      onDrop: dropHandler,
      multiple,
      accept,
    })

    return (
      <div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : darkMode
              ? "border-slate-700 bg-slate-950"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <input {...getInputProps()} />

          <p
            className={
              darkMode
                ? "text-slate-300 font-medium"
                : "text-slate-600 font-medium"
            }
          >
            Drag & Drop files here
          </p>

          <p className="text-slate-400 text-sm mt-2">
            or click to browse
          </p>
        </div>

        {files?.length > 0 && (
          <div
            className={`mt-4 border rounded-2xl p-4 ${theme.cardSoft}`}
          >
            <div
              className={`flex items-center justify-between text-sm ${theme.muted}`}
            >
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
                  key={index}
                  className={`rounded-xl px-4 py-3 border flex items-center justify-between ${theme.fileBox}`}
                >
                  <span className="truncate max-w-[70%]">
                    {file.name}
                  </span>

                  <span className="text-slate-400 text-sm">
                    {formatFileSize(file.size)}
                  </span>
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
    if (mergeFiles.length < 2) {
      setMessage("Select at least 2 PDFs")
      return
    }

    const formData = new FormData()

    mergeFiles.forEach((file) => {
      formData.append("files", file)
    })

    callTool(
      "/merge-pdf",
      formData,
      "merged_output.pdf",
      "PDF merged successfully"
    )
  }

  const splitPDF = () => {
    if (!singlePdf) {
      setMessage("Select one PDF")
      return
    }

    const formData = new FormData()

    formData.append("file", singlePdf)

    callTool(
      "/split-pdf",
      formData,
      "split_pages.zip",
      "PDF split successfully"
    )
  }

  const jpgToPDF = () => {
    if (imageFiles.length < 1) {
      setMessage("Select images")
      return
    }

    const formData = new FormData()

    imageFiles.forEach((file) => {
      formData.append("files", file)
    })

    callTool(
      "/jpg-to-pdf",
      formData,
      "images_to_pdf.pdf",
      "Images converted to PDF"
    )
  }

  const compressPDF = () => {
    if (!singlePdf) {
      setMessage("Select one PDF")
      return
    }

    const formData = new FormData()

    formData.append("file", singlePdf)

    callTool(
      "/compress-pdf",
      formData,
      "compressed.pdf",
      "PDF compressed successfully"
    )
  }

  const extremeCompressPDF = () => {
    if (!singlePdf) {
      setMessage("Select one PDF")
      return
    }

    const formData = new FormData()

    formData.append("file", singlePdf)

    formData.append("quality", compressQuality)

    callTool(
      "/extreme-compress-pdf",
      formData,
      `extreme_${compressQuality}.pdf`,
      `Extreme compression completed (${compressQuality})`
    )
  }

  return (
    <div className={`min-h-screen flex ${theme.page}`}>
      <aside className={`w-72 text-white p-8 ${theme.sidebar}`}>
        <h1 className="text-4xl font-bold">
          ATLAS
        </h1>

        <p className="text-slate-400 mt-2">
          Agency Operating System
        </p>
      </aside>

      <main className="flex-1 p-10 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-5xl font-bold ${theme.text}`}>
              Atlas Dashboard
            </h2>

            <p className={`mt-3 text-lg ${theme.muted}`}>
              PDF + AI + OCR workflow system
            </p>
          </div>

          <button
            onClick={toggleDarkMode}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2 border ${
              darkMode
                ? "bg-white text-slate-900 border-white"
                : "bg-slate-900 text-white border-slate-900"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 mt-8">
          <div className={`rounded-3xl p-6 border shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  TOTAL TOOLS
                </p>

                <h3 className={`text-3xl font-bold mt-2 ${theme.text}`}>
                  11
                </h3>
              </div>

              <div className={darkMode ? "bg-slate-800 p-4 rounded-2xl" : "bg-slate-100 p-4 rounded-2xl"}>
                <Wrench className={iconClass} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 border shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  COMPLETED
                </p>

                <h3 className={`text-3xl font-bold mt-2 ${theme.text}`}>
                  {history.length}
                </h3>
              </div>

              <div className={darkMode ? "bg-slate-800 p-4 rounded-2xl" : "bg-slate-100 p-4 rounded-2xl"}>
                <CheckCircle className={iconClass} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 border shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  SELECTED FILES
                </p>

                <h3 className={`text-3xl font-bold mt-2 ${theme.text}`}>
                  {selectedFilesCount}
                </h3>
              </div>

              <div className={darkMode ? "bg-slate-800 p-4 rounded-2xl" : "bg-slate-100 p-4 rounded-2xl"}>
                <Files className={iconClass} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 border shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  STATUS
                </p>

                <h3 className={`text-lg font-bold mt-2 ${theme.text}`}>
                  {message}
                </h3>
              </div>

              <div className={darkMode ? "bg-slate-800 p-4 rounded-2xl" : "bg-slate-100 p-4 rounded-2xl"}>
                <Activity className={iconClass} />
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-8 rounded-3xl p-6 border ${theme.card}`}>
          <div className="flex items-center gap-3">
            <Search className="text-slate-400" />

            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full outline-none ${
                darkMode
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <section className={`rounded-3xl shadow-sm border p-6 ${theme.card}`}>
            <div className="flex items-center gap-3">
              <div className={darkMode ? "bg-slate-800 p-3 rounded-2xl" : "bg-slate-100 p-3 rounded-2xl"}>
                <Zap className={iconClass} />
              </div>

              <div>
                <h3 className={`text-xl font-bold ${theme.text}`}>
                  Extreme Compress PDF
                </h3>

                <p className={`text-sm mt-1 ${theme.muted}`}>
                  Ultra compression using Ghostscript
                </p>
              </div>
            </div>

            <div className="mt-6">
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
                <option value="screen">
                  Screen (Smallest Size)
                </option>

                <option value="ebook">
                  Ebook (Balanced)
                </option>

                <option value="printer">
                  Printer (Better Quality)
                </option>

                <option value="prepress">
                  Prepress (High Quality)
                </option>
              </select>

              <button
                onClick={extremeCompressPDF}
                className="mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl"
              >
                Extreme Compress PDF
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App