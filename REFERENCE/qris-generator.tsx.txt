"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { QRCodeDisplay } from "@/components/qr-code-display"
import { Upload, Loader2, Sparkles } from "lucide-react"

export function QRISGenerator() {
  const [staticQRIS, setStaticQRIS] = useState("")
  const [nominal, setNominal] = useState("")
  const [dynamicQRIS, setDynamicQRIS] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertCRC16 = (data: string): string => {
    let crc = 0xffff
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021
        } else {
          crc <<= 1
        }
        crc &= 0xffff
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0")
  }

  const generateDynamicQRIS = (staticCode: string, amount: string): string => {
    // Remove last 4 characters (CRC)
    let qris = staticCode.slice(0, -4)

    // Change from static (010211) to dynamic (010212)
    qris = qris.replace("010211", "010212")

    // Split by 5802ID to insert amount
    const parts = qris.split("5802ID")

    // Format: 54 + length + amount + 5802ID
    const amountTag = "54" + amount.length.toString().padStart(2, "0") + amount + "5802ID"

    // Combine parts
    const finalQRIS = parts[0] + amountTag + parts[1]

    // Add CRC16
    return finalQRIS + convertCRC16(finalQRIS)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    // Simulate processing - in real app, you'd use OCR or QR decoder
    setTimeout(() => {
      // For demo, use the hardcoded QRIS from the Python script
      const demoQRIS =
        "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214610189749241770303UMI51440014ID.CO.QRIS.WWW0215ID20243299634560303UMI5204541153033605802ID5925HOSHIYUKI STORE OK18972926008SEMARANG61055011162070703A016304F6C8"
      setStaticQRIS(demoQRIS)
      setIsProcessing(false)
    }, 1500)
  }

  const handleGenerate = () => {
    if (!staticQRIS || !nominal) return

    setIsProcessing(true)
    setTimeout(() => {
      const dynamic = generateDynamicQRIS(staticQRIS, nominal)
      setDynamicQRIS(dynamic)
      setIsProcessing(false)
    }, 500)
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers ? Number.parseInt(numbers).toLocaleString("id-ID") : ""
  }

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setNominal(value)
  }

  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10 bg-card border-border shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <Label htmlFor="qris-upload" className="text-lg font-bold">
                Upload Static QRIS
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Upload your static QRIS image or enter the QRIS code manually
            </p>

            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <p className="text-base font-semibold mb-2">Click to upload QRIS image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qris-upload"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 py-1 text-muted-foreground rounded-full">Or enter manually</span>
                </div>
              </div>

              <div>
                <Input
                  placeholder="Paste your static QRIS code here"
                  value={staticQRIS}
                  onChange={(e) => setStaticQRIS(e.target.value)}
                  className="font-mono text-sm h-12 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <Label htmlFor="nominal" className="text-lg font-bold">
                Enter Amount
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Specify the payment amount in Indonesian Rupiah
            </p>

            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                  Rp
                </span>
                <Input
                  id="nominal"
                  type="text"
                  placeholder="0"
                  value={formatCurrency(nominal)}
                  onChange={handleNominalChange}
                  className="pl-14 text-xl font-bold h-14 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!staticQRIS || !nominal || isProcessing}
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Generate Dynamic QRIS
              </>
            )}
          </Button>
        </div>
      </Card>

      {dynamicQRIS && <QRCodeDisplay qrisData={dynamicQRIS} amount={nominal} />}
    </div>
  )
}
