#!/bin/bash

# recursively delete all files names either JS.js or Legacy.tsx throughout the entire project
find . -type f -name 'JS.js' -o -name 'Legacy.tsx' -delete

