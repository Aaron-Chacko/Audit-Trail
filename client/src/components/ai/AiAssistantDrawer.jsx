import { useState, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import styles from './AiAssistantDrawer.module.css';

/**
 * Simple Markdown renderer helper for clean bot messages
 */
function renderSimpleMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    if (line.startsWith('### ')) {
      elements.push(<h3 key={index}>{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={index}><strong>{line.replaceAll('**', '')}</strong></p>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={index} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.substring(2)) }} />
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={index} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace(/^\d+\.\s/, '')) }} />
      );
    } else if (line.trim()) {
      elements.push(
        <p key={index} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
      );
    }
  });

  return elements;
}

function formatInlineMarkdown(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

/**
 * AiAssistantDrawer
 * Slide-out AI Audit & Logistics Copilot panel.
 */
export default function AiAssistantDrawer({
  activeShipmentId = 'SHIP-10042',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your **AI Audit & Logistics Copilot** for **${activeShipmentId}**.\n\nI can audit cold-chain temperature compliance, detect anomalies, explain immutable ledger events, and check customs status in real-time.`,
      suggestions: [
        'Executive Audit Summary',
        'Check Cold-Chain Compliance',
        'Analyze Root Cause of Spikes',
        'Customs & Delay Status',
        'Verify Ledger Integrity',
      ],
      riskLevel: 'LOW',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      anime({
        targets: drawerRef.current,
        translateX: ['100%', '0%'],
        duration: 300,
        easing: 'easeOutCubic',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If shipment changes, reset greeting
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: `Switched context to **${activeShipmentId}**.\n\nAsk me anything about its temperature history, customs status, or immutable audit trail.`,
        suggestions: [
          'Executive Audit Summary',
          'Check Cold-Chain Compliance',
          'Analyze Root Cause of Spikes',
          'Customs & Delay Status',
          'Verify Ledger Integrity',
        ],
      },
    ]);
  }, [activeShipmentId]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateId: activeShipmentId,
          query: textToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.data.answer,
            suggestions: data.data.suggestions,
            riskLevel: data.data.riskLevel,
            metrics: data.data.metrics,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ **Error:** ${data.error?.message || 'Failed to complete AI audit query.'}`,
            suggestions: ['Executive Audit Summary', 'Check Cold-Chain Compliance'],
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ **Connection Error:** ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className={styles.floatingButton}
          onClick={() => setIsOpen(true)}
          title="Open AI Audit Copilot"
        >
          <span className={styles.botIcon}>🤖</span>
          <span>AI Audit Copilot</span>
          <span className={styles.aiBadge}>LIVE</span>
        </button>
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsOpen(false)}>
          <div
            ref={drawerRef}
            className={styles.drawer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="AI Audit Assistant"
          >
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.headerTitleGroup}>
                <div className={styles.aiGlowDot} />
                <div>
                  <h3 className={styles.headerTitle}>AI Logistics Copilot</h3>
                  <span className={styles.headerSubtitle}>
                    Real-Time Event Sourcing & Compliance Engine
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeDrawerBtn}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Target Aggregate Context */}
            <div className={styles.targetBar}>
              <span style={{ color: 'var(--color-text-muted)' }}>Auditing Aggregate:</span>
              <span className={styles.targetAggregateId}>{activeShipmentId}</span>
            </div>

            {/* Chat Messages Area */}
            <div className={styles.chatArea}>
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={index}
                    className={`${styles.messageRow} ${!isBot ? styles.userRow : ''}`}
                  >
                    <div className={`${styles.avatar} ${isBot ? styles.botAvatar : styles.userAvatar}`}>
                      {isBot ? '🤖' : '👤'}
                    </div>
                    <div className={`${styles.messageBubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
                      {renderSimpleMarkdown(msg.text)}

                      {msg.riskLevel && msg.riskLevel !== 'UNKNOWN' && (
                        <div>
                          <span
                            className={`
                              ${styles.riskPill}
                              ${msg.riskLevel === 'CRITICAL' ? styles.riskCritical : msg.riskLevel === 'MEDIUM' ? styles.riskMedium : styles.riskLow}
                            `}
                          >
                            Risk Level: {msg.riskLevel}
                          </span>
                        </div>
                      )}

                      {/* Suggestion Chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className={styles.suggestionsRow}>
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className={styles.suggestionChip}
                              onClick={() => handleSendMessage(sug)}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className={styles.messageRow}>
                  <div className={`${styles.avatar} ${styles.botAvatar}`}>🤖</div>
                  <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                    <div className={styles.loadingBubble}>
                      <div className={styles.loadingDot} />
                      <div className={styles.loadingDot} />
                      <div className={styles.loadingDot} />
                      <span>Auditing event ledger...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form className={styles.inputForm} onSubmit={handleFormSubmit}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Ask anything (e.g. cold chain risk, delay cause)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!inputValue.trim() || isLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
