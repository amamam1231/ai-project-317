import { SafeIcon } from './components/SafeIcon';
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Web3Forms Hook
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e, accessKey) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    const formData = new FormData(e.target)
    formData.append('access_key', accessKey)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        setIsSuccess(true)
        e.target.reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Что-то пошло не так')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Ошибка сети. Попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }

  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// FAQ Data for Chat
const FAQ_DATA = [
  {
    question: 'Как подключить VPN на телефоне?',
    answer: 'Скачайте приложение из App Store или Google Play, установите его, войдите по логину и паролю, который вы получите после оплаты, и нажмите кнопку "Подключить".',
    keywords: ['телефон', 'android', 'ios', 'iphone', 'установить', 'подключить', 'как', 'начать']
  },
  {
    question: 'Работает ли VPN с YouTube?',
    answer: 'Да! Наш VPN специально оптимизирован для YouTube. Вы сможете смотреть видео в высоком качестве без буферизации.',
    keywords: ['youtube', 'ютуб', 'видео', 'смотреть', 'работает']
  },
  {
    question: 'Какие способы оплаты доступны?',
    answer: 'Мы принимаем оплату через ЮMoney (YooMoney), банковские карты, а также криптовалюту. После оплаты доступ приходит мгновенно на email.',
    keywords: ['оплата', 'платеж', 'юмани', 'yoomoney', 'карта', 'оплатить', 'цена']
  },
  {
    question: 'Можно ли использовать на нескольких устройствах?',
    answer: 'Да, одна подписка работает на 5 устройствах одновременно: телефон, компьютер, планшет и другие устройства.',
    keywords: ['устройства', 'несколько', 'одновременно', 'телефон и компьютер', 'сколько']
  },
  {
    question: 'Что делать если не подключается?',
    answer: 'Попробуйте сменить сервер в приложении, проверьте интернет-соединение, или перезагрузите устройство. Если проблема остается - напишите нам в поддержку.',
    keywords: ['не работает', 'проблема', 'ошибка', 'не подключается', 'помогите']
  }
]

const SITE_CONTEXT = 'NeonVPN - сервис для безопасного доступа к интернету и разблокировки YouTube. Быстрая поддержка клиентов, простая установка, оплата через ЮMoney.'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

// Section component with scroll animation
function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Chat Widget Component
function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Привет! Я помогу ответить на вопросы о NeonVPN. Что вас интересует?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findFAQAnswer = (input) => {
    const lowerInput = input.toLowerCase()
    for (const faq of FAQ_DATA) {
      if (faq.keywords.some(keyword => lowerInput.includes(keyword))) {
        return faq.answer
      }
    }
    return null
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputValue('')
    setIsLoading(true)

    // Check FAQ first
    const faqAnswer = findFAQAnswer(userMessage)

    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: faqAnswer }])
        setIsLoading(false)
      }, 500)
    } else {
      // Fallback to API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, context: SITE_CONTEXT })
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, { type: 'bot', text: data.reply || 'Извините, я не понял вопрос. Попробуйте спросить про оплату, установку или подключение.' }])
        } else {
          throw new Error('API Error')
        }
      } catch (error) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'К сожалению, я не могу ответить на этот вопрос прямо сейчас. Напишите нам на почту support@neonvpn.ru или посмотрите раздел инструкций на сайте.'
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <SafeIcon name="x" className="w-6 h-6 text-white" />
        ) : (
          <SafeIcon name="message-square" className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[380px] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <SafeIcon name="bot" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">NeonVPN Помощник</h3>
                <p className="text-white/70 text-xs">Обычно отвечает мгновенно</p>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[320px] overflow-y-auto p-4 space-y-3 bg-slate-950">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-gray-200 border border-slate-700 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md p-3 flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Напишите вопрос..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <SafeIcon name="send" className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Header Component
function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${
      isScrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/20' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center neon-glow">
            <SafeIcon name="shield" className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Neon<span className="text-cyan-400">VPN</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Возможности</button>
          <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Тарифы</button>
          <button onClick={() => scrollToSection('reviews')} className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Отзывы</button>
          <button onClick={() => scrollToSection('instructions')} className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Установка</button>
        </nav>

        <button
          onClick={() => scrollToSection('pricing')}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-2.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25 text-sm md:text-base"
        >
          Подключить
        </button>
      </div>
    </header>
  )
}

// Hero Section
function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6">
              <SafeIcon name="zap" className="w-4 h-4" />
              <span className="text-sm font-semibold">Работает со всеми устройствами</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-tight">
              Смотрите <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 neon-text">YouTube</span>
              <br />
              без ограничений
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Быстрый и безопасный VPN для доступа к любому контенту.
              Защита данных и высокая скорость соединения.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
              >
                <SafeIcon name="play" className="w-5 h-5" />
                Начать смотреть
              </button>
              <button
                onClick={() => scrollToSection('instructions')}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <SafeIcon name="download" className="w-5 h-5" />
                Как установить
              </button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <SafeIcon name="check-circle" className="w-5 h-5 text-cyan-400" />
                <span>5 устройств</span>
              </div>
              <div className="flex items-center gap-2">
                <SafeIcon name="check-circle" className="w-5 h-5 text-cyan-400" />
                <span>Без логов</span>
              </div>
              <div className="flex items-center gap-2">
                <SafeIcon name="check-circle" className="w-5 h-5 text-cyan-400" />
                <span>Поддержка 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Features Section
function Features() {
  const features = [
    {
      icon: 'zap',
      title: 'Максимальная скорость',
      description: 'Оптимизированные серверы для просмотра видео в 4K без буферизации. Неограниченная скорость соединения.'
    },
    {
      icon: 'shield',
      title: 'Безопасность данных',
      description: 'Военный уровень шифрования AES-256. Ваш трафик надежно защищен от перехвата и слежки.'
    },
    {
      icon: 'globe',
      title: 'Доступ к контенту',
      description: 'Обходите географические ограничения и получайте доступ к YouTube, Netflix и другим сервисам из любой точки мира.'
    },
    {
      icon: 'smartphone',
      title: 'Все устройства',
      description: 'Одна подписка работает на iPhone, Android, Windows, Mac и даже роутере. До 5 устройств одновременно.'
    }
  ]

  return (
    <section id="features" className="py-24 bg-slate-950 relative">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Почему выбирают <span className="text-cyan-400">NeonVPN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Надежный сервис для тех, кто ценит свободу интернета и безопасность данных
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className="group h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <SafeIcon name={feature.icon} className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const [selectedPlan, setSelectedPlan] = useState(null)

  const plans = [
    {
      name: '1 месяц',
      price: '299',
      period: '₽/мес',
      description: 'Для знакомства с сервисом',
      features: ['Все серверы', '5 устройств', 'Поддержка 24/7', 'Без логов'],
      popular: false,
      cycle: 'monthly'
    },
    {
      name: '6 месяцев',
      price: '249',
      period: '₽/мес',
      description: 'Экономия 17%',
      features: ['Все серверы', '5 устройств', 'Поддержка 24/7', 'Без логов', 'Приоритетная скорость'],
      popular: true,
      cycle: 'half-year',
      badge: 'Выгодно'
    },
    {
      name: '12 месяцев',
      price: '199',
      period: '₽/мес',
      description: 'Экономия 33%',
      features: ['Все серверы', '5 устройств', 'Поддержка 24/7', 'Без логов', 'Приоритетная скорость', 'Резервные IP'],
      popular: false,
      cycle: 'yearly',
      badge: 'Лучшая цена'
    }
  ]

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
  }

  const closeModal = () => {
    setSelectedPlan(null)
    resetForm()
  }

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Выберите свой <span className="text-cyan-400">тариф</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Прозрачное ценообразование без скрытых платежей. Оплата через ЮMoney.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className={`relative h-full p-6 rounded-2xl border ${
                plan.popular
                  ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900/50 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              } transition-all duration-300 flex flex-col`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white text-sm font-bold">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300">
                      <SafeIcon name="check" className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  Выбрать
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {selectedPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                {!isSuccess ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-white">Оформление подписки</h3>
                      <button onClick={closeModal} className="text-gray-400 hover:text-white">
                        <SafeIcon name="x" className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Тариф</span>
                        <span className="text-white font-semibold">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Стоимость</span>
                        <span className="text-cyan-400 font-bold text-xl">{selectedPlan.price} {selectedPlan.period}</span>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e, 'YOUR_WEB3FORMS_ACCESS_KEY')} className="space-y-4">
                      <input type="hidden" name="plan" value={selectedPlan.name} />
                      <input type="hidden" name="price" value={selectedPlan.price} />

                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Email для доступа</label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="your@email.com"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Способ оплаты</label>
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">Ю</div>
                          <span className="text-white">ЮMoney (YooMoney)</span>
                          <SafeIcon name="check-circle" className="w-5 h-5 text-cyan-400 ml-auto" />
                        </div>
                      </div>

                      {isError && (
                        <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                          {errorMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Обработка...
                          </>
                        ) : (
                          <>
                            <SafeIcon name="credit-card" className="w-5 h-5" />
                            Перейти к оплате
                          </>
                        )}
                      </button>

                      <p className="text-gray-500 text-xs text-center">
                        После оплаты вы получите доступ к VPN в течение 5 минут
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SafeIcon name="check-circle" className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Заявка принята!</h3>
                    <p className="text-gray-400 mb-6">
                      Мы отправили инструкции по оплате на ваш email. После подтверждения платежа вы получите доступ к VPN.
                    </p>
                    <button
                      onClick={closeModal}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Закрыть
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// Reviews Section
function Reviews() {
  const reviews = [
    {
      name: 'Александр К.',
      rating: 5,
      text: 'Наконец-то могу смотреть любимые каналы на YouTube без тормозов. Скорость отличная, даже 4K видео грузятся мгновенно!',
      date: '2 дня назад',
      avatar: 'A'
    },
    {
      name: 'Мария С.',
      rating: 5,
      text: 'Установила на телефон и ноутбук. Очень просто, даже я разобралась) Поддержка отвечает быстро, помогли настроить.',
      date: '1 неделю назад',
      avatar: 'М'
    },
    {
      name: 'Дмитрий В.',
      rating: 5,
      text: 'Пробовал разные VPN, этот - самый стабильный. Не отключается, скорость не падает. Рекомендую годовую подписку, выгодно.',
      date: '2 недели назад',
      avatar: 'Д'
    }
  ]

  return (
    <section id="reviews" className="py-24 bg-slate-950 border-y border-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Что говорят <span className="text-cyan-400">клиенты</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Более 10,000 пользователей уже пользуются NeonVPN
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <SafeIcon key={i} name="star" className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">"{review.text}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {review.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{review.name}</div>
                    <div className="text-gray-500 text-sm">{review.date}</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// Instructions Section
function Instructions() {
  const steps = [
    {
      number: '01',
      title: 'Скачайте приложение',
      description: 'Выберите свою платформу (iOS, Android, Windows, Mac) и скачайте приложение NeonVPN из магазина или по ссылке после оплаты.',
      icon: 'download'
    },
    {
      number: '02',
      title: 'Установите и войдите',
      description: 'Установите приложение, откройте его и войдите, используя логин и пароль, которые придут вам на email после оплаты подписки.',
      icon: 'user'
    },
    {
      number: '03',
      title: 'Подключитесь',
      description: 'Выберите сервер (рекомендуем ближайший для максимальной скорости) и нажмите кнопку "Подключить". Готово!',
      icon: 'wifi'
    }
  ]

  const platforms = [
    { name: 'iPhone / iPad', icon: 'smartphone' },
    { name: 'Android', icon: 'smartphone' },
    { name: 'Windows', icon: 'monitor' },
    { name: 'MacOS', icon: 'monitor' }
  ]

  return (
    <section id="instructions" className="py-24 bg-slate-950 relative">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Как подключить <span className="text-cyan-400">VPN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Всего 3 простых шага для доступа к свободному интернету
          </p>
        </AnimatedSection>

        {/* Platform Icons */}
        <AnimatedSection className="flex flex-wrap justify-center gap-4 mb-16">
          {platforms.map((platform, index) => (
            <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-gray-300">
              <SafeIcon name={platform.icon} className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium">{platform.name}</span>
            </div>
          ))}
        </AnimatedSection>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <AnimatedSection key={index} delay={index * 0.15}>
              <div className="relative flex gap-6 mb-12 last:mb-0">
                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-cyan-500/50 to-transparent" />
                )}

                {/* Number Circle */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <SafeIcon name={step.icon} className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="text-cyan-400 font-bold text-sm mb-2">Шаг {step.number}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="text-left">
              <h4 className="text-white font-bold text-lg">Остались вопросы?</h4>
              <p className="text-gray-400 text-sm">Напишите нам в чат поддержки</p>
            </div>
            <button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2">
              <SafeIcon name="message-circle" className="w-5 h-5" />
              Написать
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 telegram-safe-bottom">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                <SafeIcon name="shield" className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">
                Neon<span className="text-cyan-400">VPN</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-sm mb-4">
              Безопасный и быстрый VPN сервис для доступа к открытому интернету.
              Смотрите YouTube, Netflix и другие сервисы без ограничений.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                <SafeIcon name="twitter" className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                <SafeIcon name="instagram" className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                <SafeIcon name="send" className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Разделы</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors">Возможности</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-cyan-400 transition-colors">Тарифы</a></li>
              <li><a href="#reviews" className="text-gray-400 hover:text-cyan-400 transition-colors">Отзывы</a></li>
              <li><a href="#instructions" className="text-gray-400 hover:text-cyan-400 transition-colors">Установка</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Поддержка</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Контакты</a></li>
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Политика конфиденциальности</a></li>
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Условия использования</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2024 NeonVPN. Все права защищены.</p>
          <p className="text-gray-600 text-sm">Оплата через ЮMoney</p>
        </div>
      </div>
    </footer>
  )
}

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Reviews />
        <Instructions />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App