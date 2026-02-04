'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string
    image: string | null
  }
}

interface Conversation {
  id: string
  vibeId: string
  vibeTitle: string
  vibeStatus: string
  otherUser: {
    id: string
    name: string
    image: string | null
    isVerified?: boolean
  }
  lastMessage: {
    content: string
    createdAt: string
    isFromMe: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

interface ConversationDetail {
  id: string
  vibe: {
    id: string
    title: string
    status: string
  }
  otherUser: {
    id: string
    name: string
    image: string | null
    isVerified?: boolean
    verificationLevel?: string
  }
  messages: Message[]
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchConversations()
    }
  }, [status, router])

  useEffect(() => {
    // Auto-refresh messages every 5 seconds when a conversation is selected
    if (selectedConv) {
      const interval = setInterval(() => {
        fetchMessages(selectedConv.id, true)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConv?.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedConv(data)
      }
    } catch (error) {
      if (!silent) addToast('Failed to load messages', 'error')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSelectConversation = (conv: Conversation) => {
    fetchMessages(conv.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/${selectedConv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages(selectedConv.id, true)
        fetchConversations()
      } else {
        const data = await res.json()
        addToast(data.error || 'Failed to send', 'error')
      }
    } catch (error) {
      addToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4 flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">💬 Messages</h1>

          <div className="glass-card rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-full md:w-1/3 border-r border-dark-700 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <span className="text-4xl mb-3 block">💬</span>
                    <p className="text-gray-400">No conversations yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Messages appear here after a winner is selected
                    </p>
                    <Link href="/market" className="mt-4 inline-block">
                      <Button size="sm">Browse Vibes</Button>
                    </Link>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left border-b border-dark-700 hover:bg-dark-800 transition-colors ${
                        selectedConv?.id === conv.id ? 'bg-dark-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                            {conv.otherUser.name?.[0] || '?'}
                          </div>
                          {conv.otherUser.isVerified && (
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.otherUser.name}</p>
                            {conv.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-purple-400 truncate">{conv.vibeTitle}</p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-400 truncate">
                              {conv.lastMessage.isFromMe ? 'You: ' : ''}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Messages Area */}
              <div className="hidden md:flex flex-col flex-1">
                {selectedConv ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                          {selectedConv.otherUser.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {selectedConv.otherUser.name}
                            {selectedConv.otherUser.isVerified && (
                              <span className="text-green-400 text-sm">✓</span>
                            )}
                          </p>
                          <Link href={`/vibe/${selectedConv.vibe.id}`} className="text-sm text-purple-400 hover:underline">
                            {selectedConv.vibe.title}
                          </Link>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedConv.vibe.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        selectedConv.vibe.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedConv.vibe.status}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : selectedConv.messages.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-400">No messages yet</p>
                          <p className="text-sm text-gray-500">Send a message to start the conversation</p>
                        </div>
                      ) : (
                        selectedConv.messages.map((msg) => {
                          const isMe = msg.senderId === session?.user?.id
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                                <div className={`px-4 py-3 rounded-2xl ${
                                  isMe 
                                    ? 'bg-purple-500 text-white rounded-br-md' 
                                    : 'bg-dark-700 text-gray-100 rounded-bl-md'
                                }`}>
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                <p className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : ''}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-700">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                          disabled={sending}
                        />
                        <Button type="submit" loading={sending} disabled={!newMessage.trim()}>
                          Send
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">💬</span>
                      <p className="text-gray-400">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
