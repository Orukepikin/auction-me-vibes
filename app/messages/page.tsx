'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Conversation {
  id: string
  vibeId: string
  vibeTitle: string
  vibeStatus: string
  otherUser: {
    id: string
    name: string
    image: string | null
    isVerified: boolean
  }
  lastMessage: {
    content: string
    createdAt: string
    isFromMe: boolean
  } | null
  unreadCount: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    name: string
    image: string | null
  }
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
    isVerified: boolean
    verificationLevel: string
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
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchConversations()
    }
  }, [status])

  useEffect(() => {
    scrollToBottom()
  }, [selectedConv?.messages])

  // Poll for new messages
  useEffect(() => {
    if (!selectedConv) return

    const interval = setInterval(() => {
      fetchConversation(selectedConv.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConv?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const fetchConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedConv(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversation')
    }
  }

  const selectConversation = async (conv: Conversation) => {
    await fetchConversation(conv.id)
    // Update unread count locally
    setConversations(prev => 
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    )
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/${selectedConv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (res.ok) {
        const message = await res.json()
        setSelectedConv(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message],
        } : null)
        setNewMessage('')
        fetchConversations() // Update last message in list
      } else {
        addToast('Failed to send message', 'error')
      }
    } catch (error) {
      addToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
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
          <h1 className="text-2xl font-bold mb-6">Messages</h1>

          <div className="glass-card rounded-2xl overflow-hidden" style={{ height: '70vh' }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-dark-700 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Messages will appear here after a winner is selected</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left border-b border-dark-700 hover:bg-dark-800 transition-colors ${
                        selectedConv?.id === conv.id ? 'bg-dark-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
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
                            {conv.unreadCount > 0 && (
                              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">{conv.vibeTitle}</p>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {conv.lastMessage.isFromMe ? 'You: ' : ''}{conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
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
                              <span className="text-green-400 text-sm">✓ Verified</span>
                            )}
                          </p>
                          <Link href={`/vibe/${selectedConv.vibe.id}`} className="text-sm text-purple-400 hover:underline">
                            {selectedConv.vibe.title}
                          </Link>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedConv.vibe.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        selectedConv.vibe.status === 'DISPUTED' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedConv.vibe.status}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedConv.messages.map((msg) => {
                        const isMe = msg.sender.id === session?.user?.id
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                              <div className={`px-4 py-2 rounded-2xl ${
                                isMe 
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                                  : 'bg-dark-700 text-white'
                              }`}>
                                <p>{msg.content}</p>
                              </div>
                              <p className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : ''}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-dark-700">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                        />
                        <Button type="submit" loading={sending} disabled={!newMessage.trim()}>
                          Send
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>Select a conversation to start chatting</p>
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
