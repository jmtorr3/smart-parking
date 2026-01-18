# ParkGrid Todo List

## Future Improvements (from README)

- [ ] Campus map view with lot locations
- [ ] Historical occupancy charts
- [ ] Peak hours prediction
- [ ] Mobile app
- [ ] Push notifications when spots open

## Frontend Enhancements

- [x] Switch from polling to WebSocket for real-time updates
  - WebSocket connection with automatic reconnection
  - Live status indicator in header ("● Live" / "○ Connecting...")
  - Granular updates (only changed lots/spots re-render)
  - Fallback to REST API if WebSocket fails
- [ ] Add loading states and error handling UI
- [ ] Implement dark mode toggle
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Responsive design improvements for mobile browsers

## Backend Enhancements

- [ ] Add rate limiting to API endpoints
- [ ] Implement API versioning
- [ ] Add pagination to list endpoints
- [ ] Create admin dashboard for lot management
- [ ] Add email verification for user registration
- [ ] Implement password reset functionality

## Simulation & IoT

- [x] Real-time simulation with daily schedule patterns (`simulate_realtime` command)
- [ ] Add configurable schedules per lot (different patterns for different lots)
- [ ] Create event-based simulation (game day parking restrictions)
- [ ] Add occupancy history logging to database
- [ ] MQTT integration for real IoT sensors

## Testing

- [x] Unit tests for all models
- [x] API endpoint tests
- [x] Authentication tests
- [ ] WebSocket consumer tests
- [ ] Frontend component tests (React Testing Library)
- [ ] End-to-end tests (Cypress or Playwright)
- [ ] Load testing for API endpoints

## CI/CD

- [x] GitHub Actions workflow for backend tests
- [x] Frontend build verification
- [x] Code linting (Ruff for Python, ESLint for JS)
- [x] Security scanning (Bandit, Safety)
- [x] Docker build verification
- [ ] Automated deployment to staging
- [ ] Production deployment pipeline
- [ ] Database migration checks in CI

## Documentation

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Developer setup guide improvements
- [ ] Architecture decision records (ADRs)
- [ ] Contributing guidelines

## Database & Performance

- [x] Add database indexes for frequently queried fields
  - Compound index on `(parking_lot, availability)` for spot queries
  - Index on `Event.date` for active events lookup
- [x] Implement caching for dashboard data (2-second TTL)
- [x] Query optimization with Django annotations (eliminated N+1 queries)
  - Dashboard: 11 queries → 1 query
  - Serializers use annotated values when available
- [x] Lightweight serializers for nested data (`ParkingLotMinimalSerializer`)
- [ ] Database connection pooling for production
- [x] Redis caching for higher traffic (Redis channel layer for WebSocket)

## Race Conditions (Critical)

These race conditions should be addressed before production deployment:

- [ ] **Spot/Lot occupancy desync** - Spot availability and lot occupancy counter are updated in separate transactions, causing brief inconsistencies
  - Location: `simulate_realtime.py:134-160`, `simulate_sensors.py:29-37`
  - Fix: Wrap spot and lot updates in `@transaction.atomic`
- [ ] **Manual occupancy counter** - `ParkingLot.occupancy` is a manual field that can diverge from actual spot counts
  - Location: `models.py:73-86`
  - Fix: Replace with computed property or database trigger
- [ ] **No `select_for_update()` on spot modifications** - Concurrent spot updates can overwrite each other
  - Fix: Use `select_for_update()` when modifying spots
- [ ] **Username duplicate race condition** - Check-then-create pattern allows duplicate usernames under concurrent registration
  - Location: `views.py:140-162`
  - Fix: Use `get_or_create()` or handle `IntegrityError`
- [ ] **Cache thundering herd** - Multiple requests rebuild cache simultaneously when it expires
  - Location: `views.py:71-103`
  - Fix: Implement cache locking pattern
- [ ] **WebSocket broadcast gaps** - Partial updates if process crashes mid-broadcast loop
  - Location: `simulate_realtime.py:174-193`
  - Fix: Batch updates or use transactions
- [ ] **Frontend optimistic updates without validation** - Stale data displayed after reconnect
  - Location: `Dashboard.jsx:32-104`
  - Fix: Re-fetch full state on WebSocket reconnect

## Security

- [ ] Add CSRF protection for non-API views
- [ ] Implement request signing for IoT sensors
- [ ] Add audit logging for admin actions
- [ ] Security headers configuration
- [ ] Input validation improvements

## DevOps

- [x] Docker WebSocket support (Daphne ASGI server)
- [x] Nginx WebSocket proxy configuration
- [ ] Kubernetes deployment manifests
- [ ] Terraform infrastructure as code
- [ ] Monitoring and alerting (Prometheus/Grafana)
- [ ] Centralized logging (ELK stack)
- [ ] Health check endpoints

---

## Priority Legend

High priority items to tackle next:
1. **Race conditions** (data integrity - critical for production)
2. Historical occupancy charts (valuable feature)
3. API documentation (developer experience)
4. Frontend tests (code quality)
5. WebSocket consumer tests
