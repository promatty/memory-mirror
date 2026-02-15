#!/usr/bin/env python3
"""
Test script for ElevenLabs Text-to-Speech integration.
Run from backend directory: python -m tests.test_tts
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.elevenlabs_service import get_elevenlabs_service

def test_basic_tts():
    """Test basic text-to-speech conversion."""
    print("🎤 Testing ElevenLabs Text-to-Speech...")
    print("-" * 50)
    
    try:
        # Get service instance
        service = get_elevenlabs_service()
        print("✅ ElevenLabs service initialized")
        
        # Test text
        test_text = "Hello from memory-mirror"
        print(f"\n📝 Converting text: '{test_text}'")
        
        # Generate speech
        audio_path = service.text_to_speech(
            text=test_text,
            output_filename="test_hello"
        )
        
        print(f"\n✅ SUCCESS!")
        print(f"📁 Audio file saved to: {audio_path}")
        print(f"📊 File size: {audio_path.stat().st_size / 1024:.2f} KB")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

def test_list_voices():
    """Test listing available voices."""
    print("\n" + "=" * 50)
    print("🎵 Listing available voices...")
    print("-" * 50)
    
    try:
        service = get_elevenlabs_service()
        voices = service.list_voices()
        
        print(f"\n✅ Found {len(voices)} voices:")
        for i, voice in enumerate(voices[:10], 1):  # Show first 10
            print(f"  {i}. {voice.name} (ID: {voice.voice_id})")
        
        if len(voices) > 10:
            print(f"  ... and {len(voices) - 10} more")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

def test_custom_text():
    """Test with custom longer text."""
    print("\n" + "=" * 50)
    print("📖 Testing with longer text...")
    print("-" * 50)
    
    try:
        service = get_elevenlabs_service()
        
        custom_text = """
        Welcome to Memory Mirror, where your memories come to life. 
        This is a test of the text-to-speech integration using ElevenLabs API.
        """
        
        print(f"\n📝 Converting text: '{custom_text.strip()[:50]}...'")
        
        audio_path = service.text_to_speech(
            text=custom_text.strip(),
            output_filename="test_custom"
        )
        
        print(f"\n✅ SUCCESS!")
        print(f"📁 Audio file saved to: {audio_path}")
        print(f"📊 File size: {audio_path.stat().st_size / 1024:.2f} KB")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚀 ElevenLabs TTS Test Suite")
    print("=" * 50)

    results = []

    # Run tests
    results.append(("Basic TTS", test_basic_tts()))
    # Skip list_voices test if API key doesn't have permission
    # results.append(("List Voices", test_list_voices()))
    results.append(("Custom Text", test_custom_text()))
    
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

