import google.generativeai as genai
from core.config import settings

class GeminiService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
    
    def generate_response(
        self,
        prompt: str,
        context: str,
        system_instruction: str = "Talk as if you were speaking in first person about your own memories and experiences."
    ) -> str:
        """
        Generate a conversational response using Gemini API.
        
        Args:
            prompt: The user's question/prompt
            context: Video summary/context from Twelve Labs
            system_instruction: Instructions for response generation
        
        Returns:
            Generated text response
        """
        try:
            # Construct the full prompt with context and instructions
            full_prompt = f"""
{system_instruction}

Context from your memory:
{context}

User question: {prompt}

Please respond naturally in first person, as if you're recalling and talking about your own memory.
"""
            
            print(f"🤖 Generating response for prompt: '{prompt[:50]}...'")
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            generated_text = response.text
            print(f"✅ Response generated successfully")
            
            return generated_text
            
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise
    
    def generate_simple_response(self, prompt: str) -> str:
        """
        Generate a simple response without context.
        
        Args:
            prompt: The user's question/prompt
        
        Returns:
            Generated text response
        """
        try:
            print(f"🤖 Generating simple response for: '{prompt[:50]}...'")
            
            response = self.model.generate_content(prompt)
            generated_text = response.text
            
            print(f"✅ Response generated successfully")
            return generated_text
            
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise

# Singleton instance
_service_instance = None

def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = GeminiService()
    return _service_instance

