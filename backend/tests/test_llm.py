#!/usr/bin/env python3
"""
Test script for WatsonX LLM integration.
Run from backend directory: python -m tests.test_llm
"""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.llm_service import get_llm_service

async def test_basic_generation():
    """Test basic text generation."""
    print("🤖 Testing LLM Basic Generation...")
    print("-" * 50)

    try:
        # Get service instance
        service = get_llm_service()
        print("✅ LLM service initialized")

        # Test prompt
        test_prompt = "What is the capital of France?"
        print(f"\n📝 Prompt: '{test_prompt}'")

        # Generate response
        response = await service.generate_simple_response(test_prompt)

        print(f"\n✅ SUCCESS!")
        print(f"📄 Response: {response[:200]}...")
        print(f"📊 Response length: {len(response)} characters")

        return True

    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

async def test_context_based_generation():
    """Test generation with context (Memory Mirror use case)."""
    print("\n" + "=" * 50)
    print("🎓 Testing Context-Based Generation...")
    print("-" * 50)

    try:
        service = get_llm_service()

        # Simulate video context from Twelve Labs
        context = """
        A boy is studying in a library. He is reading a textbook and taking notes.
        The setting appears to be during high school or early college years.
        He looks focused and determined.
        """

        prompt = "Tell me about when you were studying in the library"

        print(f"\n📝 User prompt: '{prompt}'")
        print(f"📹 Video context: '{context.strip()[:100]}...'")

        # Generate response with context
        response = await service.generate_response(
            prompt=prompt,
            context=context,
            system_instruction="Talk as if you were speaking in first person about your own memories and experiences."
        )

        print(f"\n✅ SUCCESS!")
        print(f"📄 Generated response:")
        print(f"   {response}")
        print(f"📊 Response length: {len(response)} characters")

        return True

    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

async def test_memory_mirror_flow():
    """Test the complete Memory Mirror conversation flow."""
    print("\n" + "=" * 50)
    print("🎬 Testing Memory Mirror Conversation Flow...")
    print("-" * 50)

    try:
        service = get_llm_service()

        # Simulate the flow from memory_mirror_instructions.md
        user_prompt = "Show me a video of me during school"

        # Simulated Twelve Labs response
        video_summary = """
        A young student is sitting in a classroom during a math lesson.
        The student is actively participating, raising their hand to answer questions.
        The classroom has other students and a teacher at the front.
        This appears to be from middle school or early high school.
        """

        print(f"\n📝 User: '{user_prompt}'")
        print(f"📹 Video found with summary: '{video_summary.strip()[:100]}...'")
        print(f"\n🤖 Generating first-person response...")

        # Generate first-person response
        response = await service.generate_response(
            prompt=user_prompt,
            context=video_summary,
            system_instruction="Talk as if you were speaking in first person about your own memories. Be conversational and natural."
        )

        print(f"\n✅ SUCCESS!")
        print(f"🗣️  AI Clone says:")
        print(f"   \"{response}\"")
        print(f"\n📊 Response length: {len(response)} characters")
        print(f"✅ Ready to send to ElevenLabs for TTS conversion")

        return True

    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

async def main():
    """Main async function to run all tests."""
    print("\n" + "=" * 50)
    print("🚀 WatsonX LLM Test Suite")
    print("=" * 50)

    results = []

    # Run tests
    results.append(("Basic Generation", await test_basic_generation()))
    results.append(("Context-Based Generation", await test_context_based_generation()))
    results.append(("Memory Mirror Flow", await test_memory_mirror_flow()))

    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)

    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")

    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")

    if total_passed == len(results):
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

