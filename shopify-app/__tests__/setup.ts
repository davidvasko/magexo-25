import '@testing-library/jest-dom'
import { expect } from '@jest/globals'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveValue(value: any): R
    }
  }
}

expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
    }
  },
  toHaveClass(received, className) {
    const pass = received?.classList.contains(className)
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to have class ${className}`,
    }
  },
  toHaveValue(received, value) {
    const pass = received?.value === value
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to have value ${value}`,
    }
  }
})

describe('Test Setup', () => {
  it('should load custom matchers', () => {
    expect(true).toBe(true)
  })
}) 