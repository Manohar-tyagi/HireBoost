# AI Integration Setup Guide

HireBoost now uses real-time AI analysis for all features. This guide explains how to configure the AI services.

## 🔧 Configuration

### 1. OpenAI API Setup

1. **Get an API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account or sign in
   - Generate a new API key

2. **Configure Environment Variables:**
   - Copy `src/env.example` to `.env` in your project root
   - Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart Development Server:**
   ```bash
   npm run dev
   ```

## 🤖 AI Features

### Resume Review
- **Real-time analysis** of resume content
- **ATS score calculation** based on keyword matching
- **Intelligent suggestions** for improvements
- **Automated resume enhancement** with one-click improvements

### Mock Interview
- **Dynamic question generation** based on role and difficulty
- **Real-time answer evaluation** with detailed scoring
- **Personalized feedback** with strengths and improvement areas
- **Model answer suggestions** for better responses

### Writing Assistant
- **Template-based content generation** for cover letters and LinkedIn profiles
- **Interactive AI chat** for custom writing requests
- **Content improvement suggestions** with tone analysis
- **Professional writing optimization**

## 🛡️ Error Handling

The application includes comprehensive error handling:

- **Network connectivity issues** - Graceful fallbacks with retry options
- **API rate limiting** - User-friendly error messages
- **Invalid API keys** - Clear configuration guidance
- **Service unavailability** - Offline mode indicators

## 🔒 Security & Privacy

- **API keys are client-side only** - Never exposed in production builds
- **No data storage** - All AI interactions are real-time
- **Privacy-first approach** - User content is not retained by the AI service
- **Secure transmission** - All API calls use HTTPS encryption

## 📊 Usage Monitoring

Monitor your AI usage through:
- OpenAI Dashboard for API usage and billing
- Browser console for request/response logging (development only)
- Built-in error tracking for failed requests

## 🚀 Production Deployment

For production deployment:

1. **Set environment variables** in your hosting platform
2. **Monitor API usage** to avoid rate limits
3. **Implement usage analytics** for cost optimization
4. **Consider caching** for frequently requested content

## 🔄 Fallback Behavior

If AI services are unavailable:
- Users see clear error messages
- Features gracefully degrade to manual input
- Retry mechanisms allow recovery from temporary issues
- Status indicators show service availability

## 💡 Best Practices

- **Test with small content** first to verify API connectivity
- **Monitor API costs** especially during high usage periods
- **Implement user feedback** to improve AI prompt engineering
- **Regular updates** to AI models and prompts for better results

## 🆘 Troubleshooting

### Common Issues:

1. **"AI Service Unavailable"**
   - Check your API key configuration
   - Verify internet connectivity
   - Check OpenAI service status

2. **"API call failed"**
   - Verify API key is valid and has credits
   - Check for rate limiting
   - Ensure proper network access

3. **Slow responses**
   - Normal for complex analysis (2-10 seconds)
   - Check your internet connection
   - Consider upgrading OpenAI plan for faster responses

### Support:
- Check browser console for detailed error messages
- Verify environment variable configuration
- Test API key directly in OpenAI playground