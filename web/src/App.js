import React, { useState } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';

const FileTree = () => {
  const [expanded, setExpanded] = useState({
    root: true,
    src: true,
    commands: true,
    models: true,
    utils: true,
    events: true,
    web: true
  });

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const FileItem = ({ name, isFolder, level = 0, expandKey }) => (
    <div 
      className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer"
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onClick={() => isFolder && toggleExpand(expandKey)}
    >
      {isFolder ? (
        expanded[expandKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
      ) : null}
      {isFolder ? <Folder size={16} className="text-blue-500" /> : <FileText size={16} className="text-gray-500" />}
      <span className="text-sm font-mono">{name}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 Hefang Discord Bot</h1>
          <p className="text-gray-600 mb-4">Complete Discord.js Bot with MongoDB & React Dashboard</p>
          
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Node.js</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Discord.js</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">MongoDB</span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">React</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📁 Project Structure</h2>
            <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
              <FileItem name="hefang-js/" isFolder expandKey="root" level={0} />
              {expanded.root && (
                <>
                  <FileItem name="src/" isFolder expandKey="src" level={1} />
                  {expanded.src && (
                    <>
                      <FileItem name="commands/" isFolder expandKey="commands" level={2} />
                      {expanded.commands && (
                        <>
                          <FileItem name="moderation.js" level={3} />
                          <FileItem name="fun.js" level={3} />
                          <FileItem name="giveaway.js" level={3} />
                          <FileItem name="currency.js" level={3} />
                          <FileItem name="animanga.js" level={3} />
                          <FileItem name="tempvoice.js" level={3} />
                          <FileItem name="host.js" level={3} />
                        </>
                      )}
                      <FileItem name="events/" isFolder expandKey="events" level={2} />
                      {expanded.events && (
                        <>
                          <FileItem name="ready.js" level={3} />
                          <FileItem name="interactionCreate.js" level={3} />
                          <FileItem name="voiceStateUpdate.js" level={3} />
                        </>
                      )}
                      <FileItem name="models/" isFolder expandKey="models" level={2} />
                      {expanded.models && (
                        <>
                          <FileItem name="User.js" level={3} />
                          <FileItem name="Giveaway.js" level={3} />
                          <FileItem name="TempVoice.js" level={3} />
                        </>
                      )}
                      <FileItem name="utils/" isFolder expandKey="utils" level={2} />
                      {expanded.utils && (
                        <>
                          <FileItem name="anilist.js" level={3} />
                          <FileItem name="scraper.js" level={3} />
                          <FileItem name="embedBuilder.js" level={3} />
                        </>
                      )}
                      <FileItem name="index.js" level={2} />
                    </>
                  )}
                  <FileItem name="web/" isFolder expandKey="web" level={1} />
                  {expanded.web && (
                    <>
                      <FileItem name="src/" isFolder level={2} />
                      <FileItem name="public/" isFolder level={2} />
                      <FileItem name="server.js" level={2} />
                    </>
                  )}
                  <FileItem name="config.json" level={1} />
                  <FileItem name="package.json" level={1} />
                  <FileItem name=".env" level={1} />
                  <FileItem name="README.md" level={1} />
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✨ Features</h2>
            <div className="space-y-3">
              <FeatureCard 
                emoji="🛡️"
                title="Moderation"
                desc="Kick, Ban, Mute with duration & reason"
              />
              <FeatureCard 
                emoji="🎉"
                title="Fun"
                desc="Say command untuk repeat pesan"
              />
              <FeatureCard 
                emoji="🎁"
                title="Giveaway"
                desc="Start, End, List dengan button join/leave"
              />
              <FeatureCard 
                emoji="💰"
                title="Currency"
                desc="Balance, Daily, Coinflip, Slot, Give"
              />
              <FeatureCard 
                emoji="📺"
                title="Anime & Manga"
                desc="Info lengkap dari AniList + scraping link"
              />
              <FeatureCard 
                emoji="🎤"
                title="Temp Voice"
                desc="Setup temporary voice channels"
              />
              <FeatureCard 
                emoji="📊"
                title="Host Panel"
                desc="Monitor CPU, RAM, Disk, Ping (Owner only)"
              />
              <FeatureCard 
                emoji="🌐"
                title="Web Dashboard"
                desc="React monitoring panel dengan Discord OAuth"
              />
            </div>
          </div>
        </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🚀 Quick Start</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-2">
            <div className="text-green-400"># 1. Install dependencies</div>
            <div>$ npm install && cd web && npm install && cd ..</div>
            <div className="text-green-400 mt-3"># 2. Configure config.json</div>
            <div className="text-gray-400">Edit token, clientId, ownerId, mongoUri, clientSecret</div>
            <div className="text-green-400 mt-3"># 3. Start MongoDB</div>
            <div>$ mongod</div>
            <div className="text-green-400 mt-3"># 4. Run bot (Terminal 1)</div>
            <div>$ npm start</div>
            <div className="text-green-400 mt-3"># 5. Run web server (Terminal 2)</div>
            <div>$ cd web && node server.js</div>
            <div className="text-green-400 mt-3"># 6. Run React dashboard (Terminal 3)</div>
            <div>$ cd web && npm start</div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>📝 Note:</strong> Dashboard akan buka di http://localhost:3001 - Login dengan Discord (Owner only)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Dependencies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'discord.js',
              'mongoose',
              'ms',
              'axios',
              'puppeteer',
              'puppeteer-extra',
              'puppeteer-extra-plugin-stealth',
              'express',
              'os-utils',
              'systeminformation'
            ].map(dep => (
              <div key={dep} className="bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm font-mono">
                {dep}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ emoji, title, desc }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
    <span className="text-2xl">{emoji}</span>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  </div>
);

export default FileTree;