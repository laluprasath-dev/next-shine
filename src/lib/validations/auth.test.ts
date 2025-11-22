import { loginSchema, registerSchema } from './auth';

describe('loginSchema', () => {
  it('should pass with valid email and password', () => {
    const input = { email: 'test@example.com', password: 'Password1' };
    expect(() => loginSchema.parse(input)).not.toThrow();
  });

  it('should fail with invalid email', () => {
    const input = { email: 'invalid-email', password: 'Password1' };
    expect(() => loginSchema.parse(input)).toThrow();
  });

  it('should fail with short password', () => {
    const input = { email: 'test@example.com', password: '123' };
    expect(() => loginSchema.parse(input)).toThrow();
  });
});

describe('registerSchema', () => {
  it('should pass with valid data', () => {
    const input = {
      email: 'user@example.com',
      password: 'Password1',
      fullName: 'John Doe',
    };
    expect(() => registerSchema.parse(input)).not.toThrow();
  });

  it('should fail with invalid email', () => {
    const input = {
      email: 'invalid-email',
      password: 'Password1',
      fullName: 'John Doe',
    };
    expect(() => registerSchema.parse(input)).toThrow();
  });

  it('should fail with weak password', () => {
    const input = {
      email: 'user@example.com',
      password: 'password', // no uppercase or number
      fullName: 'John Doe',
    };
    expect(() => registerSchema.parse(input)).toThrow();
  });

  it('should fail with short fullName', () => {
    const input = {
      email: 'user@example.com',
      password: 'Password1',
      fullName: 'J',
    };
    expect(() => registerSchema.parse(input)).toThrow();
  });

  it('should fail with long fullName', () => {
    const input = {
      email: 'user@example.com',
      password: 'Password1',
      fullName: 'J'.repeat(51),
    };
    expect(() => registerSchema.parse(input)).toThrow();
  });
}); 