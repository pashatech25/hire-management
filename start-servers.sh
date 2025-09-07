#!/bin/bash

echo "🚀 Starting Hire Management App with Puppeteer PDF Server..."

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $PDF_PID $REACT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start PDF server in background
echo "📄 Starting Puppeteer PDF server..."
cd server
npm start &
PDF_PID=$!
cd ..

# Wait for PDF server to start
sleep 3

# Start React app
echo "⚛️  Starting React development server..."
npm run dev &
REACT_PID=$!

echo ""
echo "✅ Both servers are starting up..."
echo "📱 React app: http://localhost:5173"
echo "📄 PDF server: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $REACT_PID $PDF_PID
