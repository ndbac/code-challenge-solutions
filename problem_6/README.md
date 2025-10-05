# Live Scoreboard API Service Module

## Overview

This module provides a secure, real-time scoreboard system that displays the top 10 user scores with live updates. The system handles score updates from user actions while preventing unauthorized score manipulation through robust authentication and validation mechanisms.

## Features

- **Real-time Updates**: Live scoreboard updates using WebSocket connections
- **Top 10 Leaderboard**: Displays the highest scoring users
- **Secure Score Updates**: Prevents malicious score manipulation
- **Action Validation**: Validates user actions before score updates
- **Rate Limiting**: Prevents abuse through request throttling
- **Audit Logging**: Tracks all score-related activities

## Architecture Components

### Flowchart

https://www.mermaidchart.com/d/51765801-6d27-4d00-9b4a-9f6173098923

### 1. Score Management Service
- Handles score calculations and updates
- Validates action authenticity
- Manages user score persistence

### 2. Real-time Communication Layer
- WebSocket server for live updates
- Broadcast mechanism for scoreboard changes
- Connection management and cleanup

### 3. Authentication & Authorization
- JWT-based authentication
- Action token validation
- Rate limiting per user

### 4. Data Layer
- User scores storage
- Action logs and audit trail
- Leaderboard caching

## API Endpoints

### Score Update Endpoint
```
POST /api/v1/scores/update
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "actionToken": "string",
  "actionType": "string",
  "timestamp": "ISO8601",
  "metadata": {
    "sessionId": "string",
    "clientFingerprint": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "newScore": 1250,
  "rank": 5,
  "scoreIncrease": 50
}
```

### Get Leaderboard
```
GET /api/v1/scoreboard/top10
```

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user123",
      "username": "player1",
      "score": 2500,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## WebSocket Events

### Client → Server

#### Subscribe to Leaderboard
```json
{
  "type": "subscribe_leaderboard",
  "token": "jwt_token"
}
```

### Server → Client

#### Leaderboard Update
```json
{
  "type": "leaderboard_update",
  "data": {
    "leaderboard": [...],
    "changedRanks": [1, 5, 7]
  }
}
```

#### Score Update Notification
```json
{
  "type": "score_update",
  "data": {
    "userId": "user123",
    "newScore": 1300,
    "oldRank": 6,
    "newRank": 4,
    "scoreIncrease": 50
  }
}
```

## Security Measures

### 1. Action Token Validation
- Each valid user action generates a cryptographically signed token
- Tokens are single-use and time-limited (5 minutes)
- Server validates token signature and ensures it hasn't been used

### 2. Rate Limiting
- Maximum 10 score updates per minute per user
- Sliding window rate limiting
- Temporary suspension for repeated violations

### 3. Authentication
- JWT tokens with short expiration (15 minutes)
- Refresh token mechanism
- Session validation on each request

### 4. Anti-Fraud Measures
- Client fingerprinting to detect suspicious patterns
- Score increase validation based on action type
- Anomaly detection for unusual scoring patterns

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Score_Updates Table
```sql
CREATE TABLE score_updates (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action_token VARCHAR(255) UNIQUE NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    score_increase INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    client_ip INET,
    session_id VARCHAR(255)
);
```

### Action_Tokens Table
```sql
CREATE TABLE action_tokens (
    token_hash VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    score_value INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/scoreboard
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ACTION_TOKEN_SECRET=your-action-token-secret
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10

# WebSocket
WS_PORT=8080
WS_HEARTBEAT_INTERVAL=30000

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTION_TOKEN",
    "message": "The provided action token is invalid or expired",
    "details": {
      "timestamp": "2024-01-15T10:30:00Z",
      "requestId": "req_123456"
    }
  }
}
```

### Common Error Codes
- `INVALID_ACTION_TOKEN`: Token is invalid, expired, or already used
- `RATE_LIMIT_EXCEEDED`: User has exceeded the rate limit
- `UNAUTHORIZED`: Invalid or missing authentication
- `INVALID_ACTION_TYPE`: Unknown or invalid action type
- `SCORE_VALIDATION_FAILED`: Score increase doesn't match action type

## Performance Considerations

### Caching Strategy
- Redis cache for top 10 leaderboard (TTL: 30 seconds)
- User score cache (TTL: 5 minutes)
- Rate limiting counters in Redis

### Database Optimization
- Indexed queries on user scores
- Partitioned score_updates table by date
- Read replicas for leaderboard queries

### WebSocket Optimization
- Connection pooling and cleanup
- Efficient broadcast mechanisms
- Heartbeat monitoring for dead connections

## Monitoring & Observability

### Metrics to Track
- Score update frequency per user
- WebSocket connection count
- API response times
- Rate limiting violations
- Authentication failures

### Logging
- All score updates with full context
- Security violations and suspicious activities
- WebSocket connection events
- Performance metrics

## Deployment Requirements

### Infrastructure
- Application server (Node.js/Python/Go)
- PostgreSQL database with read replicas
- Redis for caching and rate limiting
- Load balancer with WebSocket support
- Monitoring stack (Prometheus/Grafana)

### Scaling Considerations
- Horizontal scaling with sticky sessions for WebSockets
- Database connection pooling
- CDN for static leaderboard data
- Message queue for high-volume score updates

## Testing Strategy

### Unit Tests
- Score calculation logic
- Token validation functions
- Rate limiting mechanisms
- WebSocket event handlers

### Integration Tests
- End-to-end score update flow
- WebSocket communication
- Database operations
- Authentication workflows

### Load Testing
- Concurrent score updates
- WebSocket connection limits
- Database performance under load
- Rate limiting effectiveness

### Scalability Considerations

#### Horizontal Scaling Architecture
- **Stateless API Services**: All services should be stateless to enable horizontal scaling
- **Database Sharding**: Partition users by user_id hash for large-scale deployments
- **Redis Clustering**: Use Redis Cluster for high availability and scalability
- **Message Queue Integration**: Use Redis Pub/Sub or RabbitMQ for cross-instance communication


### Monitoring and Alerting

#### 1. Key Performance Indicators (KPIs)
- **Response Time**: API response time percentiles (p50, p95, p99)
- **Throughput**: Requests per second, score updates per minute
- **Error Rate**: 4xx and 5xx error percentages
- **WebSocket Metrics**: Active connections, message throughput
- **Database Performance**: Query execution time, connection pool usage

#### 2. Alert Thresholds
```yaml
alerts:
  api_response_time:
    warning: 500ms
    critical: 1000ms
  error_rate:
    warning: 1%
    critical: 5%
  websocket_connections:
    warning: 80% of capacity
    critical: 95% of capacity
  database_connections:
    warning: 70% of pool
    critical: 90% of pool
```

### Disaster Recovery and Business Continuity

#### 1. Backup Strategy
- **Database Backups**: Daily full backups, hourly incremental backups
- **Redis Persistence**: RDB snapshots every 15 minutes, AOF for durability
- **Configuration Backups**: Version-controlled infrastructure as code

#### 2. Failover Procedures
- **Database Failover**: Automatic promotion of read replicas
- **Redis Failover**: Redis Sentinel for automatic failover
- **Application Failover**: Health checks and automatic instance replacement


### Development Guidelines

#### 1. Code Quality Standards
- **Test Coverage**: Minimum 80% code coverage
- **Code Review**: All changes require peer review
- **Static Analysis**: Use ESLint, SonarQube, or similar tools
- **Security Scanning**: Regular dependency vulnerability scans

#### 2. API Versioning Strategy
```javascript
// URL versioning
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Header versioning (alternative)
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});
```

#### 3. Documentation Standards
- **API Documentation**: OpenAPI/Swagger specifications
- **Code Documentation**: JSDoc or equivalent for all public methods
- **Architecture Documentation**: C4 model diagrams
- **Runbook Documentation**: Operational procedures and troubleshooting
