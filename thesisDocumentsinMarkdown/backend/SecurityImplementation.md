# CoinDrop Security Implementation

## Authentication Flow

### 1. Registration Process
```javascript
// 1. Validate input
const { error } = validateRegistration(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });

// 2. Check if user exists
let user = await User.findOne({ email: req.body.email });
if (user) return res.status(400).json({ error: 'User already registered' });

// 3. Hash password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(req.body.password, salt);

// 4. Create user
user = new User({
  name: req.body.name,
  email: req.body.email,
  password: hashedPassword
});

// 5. Save user
await user.save();

// 6. Generate JWT
const token = user.generateAuthToken();
```

### 2. Login Process
```javascript
// 1. Validate credentials
const { error } = validateLogin(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });

// 2. Find user
const user = await User.findOne({ email: req.body.email });
if (!user) return res.status(400).json({ error: 'Invalid email or password' });

// 3. Verify password
const validPassword = await bcrypt.compare(req.body.password, user.password);
if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

// 4. Generate token
const token = user.generateAuthToken();
```

## JWT Implementation

### Token Generation
```javascript
generateAuthToken() {
  return jwt.sign(
    { 
      id: this._id,
      name: this.name,
      email: this.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}
```

### Token Verification Middleware
```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};
```

## Password Security

### Password Hashing
```javascript
userSchema.pre('save', async function(next) {
  const user = this;
  
  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  
  next();
});
```

### Password Reset Flow
1. User requests password reset
2. Generate unique token with expiry
3. Send reset email with token
4. Verify token on reset attempt
5. Update password with new hash

## Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', apiLimiter);
```

## CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

## Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
```

## Data Validation

### Input Sanitization
```javascript
const sanitize = require('mongo-sanitize');

app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);
  next();
});
```

### Request Validation
```javascript
const Joi = require('joi');

const validateTransaction = (data) => {
  const schema = Joi.object({
    amount: Joi.number().required().min(0),
    type: Joi.string().required().valid('income', 'expense', 'transfer'),
    category: Joi.string().required(),
    description: Joi.string().max(500),
    date: Joi.date().required()
  });
  
  return schema.validate(data);
};
```

## Security Best Practices

1. **Environment Variables**
   - Sensitive data stored in .env
   - Different configs per environment
   - Regular key rotation

2. **Error Handling**
   - Custom error classes
   - Sanitized error messages
   - Detailed logging (not exposed)

3. **Session Management**
   - Secure session configuration
   - Token expiration
   - Refresh token rotation

4. **Audit Logging**
   - Security events logging
   - Access attempts tracking
   - Suspicious activity monitoring

## API Security

1. **Authentication**
   - Required for all protected routes
   - Token validation on each request
   - Role-based access control

2. **Data Protection**
   - Encryption at rest
   - Encryption in transit (HTTPS)
   - Data masking for sensitive info

3. **Request Protection**
   - CSRF tokens
   - Request size limits
   - File upload validation

## Monitoring and Alerts

1. **Security Monitoring**
   - Failed login attempts
   - Unusual activity patterns
   - Rate limit breaches

2. **Alert System**
   - Real-time security alerts
   - Admin notifications
   - Incident response triggers

3. **Logging Strategy**
   - Structured log format
   - Secure log storage
   - Log rotation policy
