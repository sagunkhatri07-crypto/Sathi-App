import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, MessageCircle, Lock, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SecureChat</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-blue-600 rounded-2xl">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            Secure messaging for the <span className="text-blue-600">modern world</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-pretty max-w-2xl mx-auto">
            Experience truly private conversations with end-to-end encryption, group chats, voice calls, and AI-powered
            features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
              <Link href="/auth/signup">Start messaging securely</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 bg-transparent">
              <Link href="/auth/login">Sign in to your account</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit mx-auto mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">End-to-End Encryption</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your messages are encrypted and only you and your recipients can read them.
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Group Conversations</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create secure group chats with friends, family, or colleagues.
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Features</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Smart message suggestions, translation, and content moderation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
