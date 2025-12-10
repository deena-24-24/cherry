import React from 'react'
import { Button } from '../../components/ui/Button/Button'

export const CompilerPage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <h1 className="text-center mb-lg">Online Compiler</h1>
      {/* Language Selector and Run Button */}
      <div className="d-flex justify-between items-center mb-md">
        <div className="form-group">
          <label htmlFor="language" className="text-bold">Language:</label>
          <select id="language" name="language" className="pd-sm border rounded">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <Button>Run Code</Button>
      </div>

      {/* Code Editor */}
      <div className="mb-md">
        <label htmlFor="code-editor" className="text-bold d-block mb-sm">Code:</label>
        <textarea
          id="code-editor"
          className="w-100 border rounded"
          style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '1rem', padding: '1rem' }}
          defaultValue={`function solve() {\n  // Write your code here\n  console.log("Hello, World!");\n}\nsolve();`}
        />
      </div>

      {/* Output/Result Area */}
      <div>
        <h3 className="text-bold">Output:</h3>
        <div className="bg-light pd-md rounded" style={{ minHeight: '100px', fontFamily: 'monospace' }}>
          {/* Placeholder for code execution result */}
          Hello, World!
        </div>
      </div>
    </div>
  )
}

// Add w-100 utility class to App.css if it doesn't exist
// .w-100 { width: 100%; }