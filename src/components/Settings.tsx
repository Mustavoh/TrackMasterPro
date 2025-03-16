import { useState } from "react";
import Header from "./layout/Header";
import { 
  Bell, 
  Shield, 
  Clock, 
  Monitor, 
  Database, 
  Key, 
  Lock, 
  Save,
  Info,
  AlertCircle,
  Eye
} from "lucide-react";

export default function Settings() {
  // State for various settings
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [keystrokeLogging, setKeystrokeLogging] = useState(true);
  const [screenshotCapture, setScreenshotCapture] = useState(true);
  const [screenshotInterval, setScreenshotInterval] = useState(10);
  const [clipboardMonitoring, setClipboardMonitoring] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [sensitiveDataDetection, setSensitiveDataDetection] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(30);
  
  // Encryption key settings
  const [encryptionKey, setEncryptionKey] = useState("****************************************");
  const [showKey, setShowKey] = useState(false);
  
  // MongoDB connection settings
  const [mongoUri, setMongoUri] = useState("mongodb+srv://****:****@cluster0.m8lbp.mongodb.net");
  const [showMongoUri, setShowMongoUri] = useState(false);
  
  // Groq API key settings
  const [groqApiKey, setGroqApiKey] = useState("gsk_************************");
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  
  // Handle form submission
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would call an API to update the settings
    alert("Settings saved successfully!");
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Settings" />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        <form onSubmit={handleSaveSettings}>
          {/* Monitoring Settings */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Monitoring Settings
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Main Monitoring Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Enable Monitoring</h4>
                  <p className="text-xs text-gray-400 mt-1">Master switch for all monitoring activities</p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="monitoring-toggle" 
                    id="monitoring-toggle" 
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                    checked={monitoringEnabled}
                    onChange={() => setMonitoringEnabled(!monitoringEnabled)}
                  />
                  <label 
                    htmlFor="monitoring-toggle" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${monitoringEnabled ? 'bg-secondary' : 'bg-gray-700'}`}
                  ></label>
                </div>
              </div>
              
              <div className={`space-y-4 ${monitoringEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                {/* Keystroke Logging */}
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium">Keystroke Logging</h4>
                    <p className="text-xs text-gray-400 mt-1">Record and store user keyboard activity</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="keystroke-toggle" 
                      id="keystroke-toggle" 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                      checked={keystrokeLogging}
                      onChange={() => setKeystrokeLogging(!keystrokeLogging)}
                    />
                    <label 
                      htmlFor="keystroke-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${keystrokeLogging ? 'bg-secondary' : 'bg-gray-700'}`}
                    ></label>
                  </div>
                </div>
                
                {/* Screenshot Capture */}
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium">Screenshot Capture</h4>
                    <p className="text-xs text-gray-400 mt-1">Automatically capture user's screen at intervals</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="screenshot-toggle" 
                      id="screenshot-toggle" 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                      checked={screenshotCapture}
                      onChange={() => setScreenshotCapture(!screenshotCapture)}
                    />
                    <label 
                      htmlFor="screenshot-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${screenshotCapture ? 'bg-secondary' : 'bg-gray-700'}`}
                    ></label>
                  </div>
                </div>
                
                {/* Screenshot Interval */}
                <div className={`pl-8 ${screenshotCapture ? '' : 'opacity-50 pointer-events-none'}`}>
                  <div className="flex flex-col">
                    <label htmlFor="screenshot-interval" className="text-sm font-medium">
                      Screenshot Interval (minutes)
                    </label>
                    <div className="mt-1 flex space-x-2 items-center">
                      <input 
                        type="range" 
                        id="screenshot-interval" 
                        min="1" 
                        max="60" 
                        value={screenshotInterval}
                        onChange={(e) => setScreenshotInterval(parseInt(e.target.value))}
                        className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm">{screenshotInterval} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Clipboard Monitoring */}
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium">Clipboard Monitoring</h4>
                    <p className="text-xs text-gray-400 mt-1">Monitor and log clipboard content</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="clipboard-toggle" 
                      id="clipboard-toggle" 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                      checked={clipboardMonitoring}
                      onChange={() => setClipboardMonitoring(!clipboardMonitoring)}
                    />
                    <label 
                      htmlFor="clipboard-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${clipboardMonitoring ? 'bg-secondary' : 'bg-gray-700'}`}
                    ></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert Settings */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Alert Settings
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Alerts Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Enable Alerts</h4>
                  <p className="text-xs text-gray-400 mt-1">Receive notifications for suspicious activities</p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="alerts-toggle" 
                    id="alerts-toggle" 
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                    checked={alertsEnabled}
                    onChange={() => setAlertsEnabled(!alertsEnabled)}
                  />
                  <label 
                    htmlFor="alerts-toggle" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${alertsEnabled ? 'bg-secondary' : 'bg-gray-700'}`}
                  ></label>
                </div>
              </div>
              
              <div className={`space-y-4 ${alertsEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                {/* Sensitive Data Detection */}
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium">Sensitive Data Detection</h4>
                    <p className="text-xs text-gray-400 mt-1">Alert when credit cards, SSNs, or other sensitive data is detected</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="sensitive-data-toggle" 
                      id="sensitive-data-toggle" 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                      checked={sensitiveDataDetection}
                      onChange={() => setSensitiveDataDetection(!sensitiveDataDetection)}
                    />
                    <label 
                      htmlFor="sensitive-data-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${sensitiveDataDetection ? 'bg-secondary' : 'bg-gray-700'}`}
                    ></label>
                  </div>
                </div>
                
                {/* AI Analysis */}
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium">AI Behavior Analysis</h4>
                    <p className="text-xs text-gray-400 mt-1">Use AI to detect unusual patterns and potential threats</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="ai-toggle" 
                      id="ai-toggle" 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer right-0"
                      checked={aiAnalysisEnabled}
                      onChange={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}
                    />
                    <label 
                      htmlFor="ai-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${aiAnalysisEnabled ? 'bg-secondary' : 'bg-gray-700'}`}
                    ></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Retention Settings */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Retention
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Data Retention Period</h4>
                  <p className="text-xs text-gray-400 mt-1">How long to keep monitoring data before automatic deletion</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select 
                    className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm"
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">365 days</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-500/10 p-3 rounded flex items-start">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="ml-2 text-sm text-gray-300">
                  <p>Data retention policies should comply with your organization's regulatory requirements and privacy policies.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security & API Keys
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Encryption Key */}
              <div>
                <label htmlFor="encryption-key" className="block text-sm font-medium">
                  AES Encryption Key
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="relative flex-1">
                    <input 
                      type={showKey ? "text" : "password"} 
                      id="encryption-key" 
                      className="w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowKey(!showKey)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    type="button"
                    className="bg-primary hover:bg-primary-light text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm"
                  >
                    Generate New
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Used for encrypting and decrypting sensitive data</p>
              </div>
              
              {/* MongoDB URI */}
              <div>
                <label htmlFor="mongo-uri" className="block text-sm font-medium">
                  MongoDB Connection URI
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="relative flex-1">
                    <input 
                      type={showMongoUri ? "text" : "password"} 
                      id="mongo-uri" 
                      className="w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm"
                      value={mongoUri}
                      onChange={(e) => setMongoUri(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowMongoUri(!showMongoUri)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    type="button"
                    className="bg-primary hover:bg-primary-light text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm"
                  >
                    Test
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">MongoDB connection string including authentication</p>
              </div>
              
              {/* Groq API Key */}
              <div>
                <label htmlFor="groq-api-key" className="block text-sm font-medium">
                  Groq API Key
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="relative flex-1">
                    <input 
                      type={showGroqApiKey ? "text" : "password"} 
                      id="groq-api-key" 
                      className="w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm"
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowGroqApiKey(!showGroqApiKey)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    type="button"
                    className="bg-primary hover:bg-primary-light text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm"
                  >
                    Verify
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Used for AI-powered analysis of user behavior</p>
              </div>
              
              <div className="bg-red-500/10 p-3 rounded flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="ml-2 text-sm text-gray-300">
                  <p>Keep these keys secure. Exposing them may compromise your monitoring data security.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-secondary hover:bg-secondary-light text-white font-medium py-2 px-4 rounded-md flex items-center"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
