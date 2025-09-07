#!/bin/bash

echo "🚀 Starting PDF Generation System..."

# Start PDF server
echo "📄 Starting PDF server..."
cd server
npm start &
PDF_PID=$!

# Wait for PDF server to start
sleep 3

# Start React app
echo "⚛️  Starting React app..."
cd ..
npm run dev &
REACT_PID=$!

echo ""
echo "✅ Both servers are running!"
echo "📱 React app: http://localhost:5173"
echo "📄 PDF server: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $REACT_PID $PDF_PID
