'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp, Zap, Wand2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 to-background pt-20 pb-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Create Memes with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate hilarious memes in seconds using AI. Choose from templates or create from scratch!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Start Creating
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="gap-2">
                <TrendingUp className="w-5 h-5" />
                Explore Memes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Wand2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
              <p className="text-muted-foreground">
                Describe your meme and let AI create both image and captions
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">50+ Templates</h3>
              <p className="text-muted-foreground">
                Choose from classic templates or upload your own
              </p>
            </Card>
            <Card className="p-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Share & Earn</h3>
              <p className="text-muted-foreground">
                Share to social media and join the community
              </p>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}