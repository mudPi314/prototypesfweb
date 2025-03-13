#!/usr/bin/env python3
import sys
import json
import subprocess
import os

def main():
    if len(sys.argv) < 5:
        print("Usage: deface_wrapper.py <input_path> <output_path> <mask_type> <keep_audio> <fps> <resolution>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    mask_type = sys.argv[3]
    keep_audio = sys.argv[4].lower() == 'true'
    fps = int(sys.argv[5])
    resolution = sys.argv[6]
    
    # Let's simplify and stick to just FPS for now
    ffmpeg_config = {
        'fps': fps
    }
    
    # Build command
    cmd = ['deface', input_path, '-o', output_path]
    
    if keep_audio:
        cmd.append('-k')
        
    # Add standard options
    cmd.extend(['--replacewith', mask_type, '--mask-scale', '1.3'])
    
    # Add ffmpeg config
    cmd.extend(['--ffmpeg-config', json.dumps(ffmpeg_config)])
    
    # Print the command for debugging
    print(f"Running command: {' '.join(cmd)}")
    
    # Run command
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    
    print(result.stdout)

if __name__ == "__main__":
    main()