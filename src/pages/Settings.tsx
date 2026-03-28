import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Button } from "@/components/ui/Button"
import { Loader2, Save } from "lucide-react"

export default function Settings() {
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")

    const [formData, setFormData] = useState({
        businessName: "Acme Clinic",
        phone: "+91-98765-43210",
        industry: "dental-clinic",
        openTime: "09:00",
        closeTime: "18:00",
        services: "General checkup\nRoot canal\nTeeth whitening",
        langs: {
            english: true,
            hindi: true,
            gujarati: false,
        }
    })

    // Basic typing handling
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = (lang: keyof typeof formData.langs) => {
        setFormData(prev => ({
            ...prev,
            langs: {
                ...prev.langs,
                [lang]: !prev.langs[lang]
            }
        }))
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccessMessage("")

        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setSuccessMessage("Settings saved successfully!")
            setTimeout(() => setSuccessMessage(""), 3000)
        }, 1000)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
                <p className="text-muted-foreground">Configure how Awaaz AI interacts with your customers.</p>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Public details the AI will use to identify your business.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91-XXXXX-XXXXX"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="industry">Industry</Label>
                                <select
                                    id="industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                                >
                                    <option value="dental-clinic">Dental Clinic</option>
                                    <option value="salon">Salon</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Configuration</CardTitle>
                            <CardDescription>
                                Help the AI understand your constraints and offerings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Business Hours</h4>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            name="openTime"
                                            value={formData.openTime}
                                            onChange={handleChange}
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="time"
                                            name="closeTime"
                                            value={formData.closeTime}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-2">Supported Languages</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.langs.english}
                                                onChange={() => handleCheckboxChange("english")}
                                                className="rounded border-border text-primary-600 cursor-pointer h-4 w-4"
                                            />
                                            English
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.langs.hindi}
                                                onChange={() => handleCheckboxChange("hindi")}
                                                className="rounded border-border text-primary-600 cursor-pointer h-4 w-4"
                                            />
                                            Hindi (हिन्दी)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.langs.gujarati}
                                                onChange={() => handleCheckboxChange("gujarati")}
                                                className="rounded border-border text-primary-600 cursor-pointer h-4 w-4"
                                            />
                                            Gujarati (ગુજરાતી)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="services">Services Offered (one per line)</Label>
                                <textarea
                                    id="services"
                                    name="services"
                                    rows={6}
                                    value={formData.services}
                                    onChange={handleChange}
                                    placeholder="e.g. Dental Checkup"
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 hide-scrollbar resize-none"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
                            <p className="text-sm text-success-600 font-medium">{successMessage}</p>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    )
}
