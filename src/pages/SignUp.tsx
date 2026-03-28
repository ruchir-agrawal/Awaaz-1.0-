import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

export default function SignUp() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [businessName, setBusinessName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    business_name: businessName,
                },
            },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (data.session) {
            navigate("/")
        } else {
            // Email confirmation required
            setSuccess(true)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Awaaz</h1>
                </div>

                <Card className="w-full shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-semibold tracking-tight">Create an account</CardTitle>
                        <CardDescription>Enter your details below to create your account</CardDescription>
                    </CardHeader>
                    {success ? (
                        <CardContent className="space-y-4 pt-4">
                            <div className="rounded-md bg-success-50 p-4 text-sm text-success-700 dark:bg-success-900/20 dark:text-success-400 border border-success-200 dark:border-success-800">
                                <p className="font-semibold mb-1">Check your email</p>
                                <p>We've sent you a confirmation link to verify your account. Please click the link to continue.</p>
                            </div>
                            <Button onClick={() => navigate("/login")} className="w-full" variant="outline">
                                Return to sign in
                            </Button>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleSignUp}>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive dark:text-red-400">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <Input
                                        id="businessName"
                                        type="text"
                                        placeholder="Acme Clinic"
                                        required
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create account
                                </Button>
                                <div className="text-center text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400"
                                    >
                                        Sign in
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    )
}
