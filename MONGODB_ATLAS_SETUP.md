# MongoDB Atlas Setup Guide for ConsentHub

## Why MongoDB Atlas?

MongoDB Atlas is the recommended database solution for ConsentHub because it offers:

- **Managed Service**: No need to install, configure, or maintain MongoDB
- **Built-in Security**: Enterprise-grade security with encryption at rest and in transit
- **Automatic Backups**: Point-in-time recovery and continuous backups
- **Global Clusters**: Deploy databases closer to your users for better performance
- **Monitoring & Alerts**: Built-in performance monitoring and alerting
- **Free Tier**: Perfect for development and testing (512MB storage, shared RAM)
- **Scalability**: Easy horizontal and vertical scaling
- **Compliance**: SOC 2, ISO 27001, HIPAA, and other compliance certifications

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Try Free" to create an account
3. Verify your email address
4. Create a new organization (optional) or use the default
5. Create a new project named "ConsentHub" or similar

### 2. Create a Database Cluster

1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier) for development
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to your location
5. Name your cluster (e.g., "consenhub-cluster")
6. Click "Create Cluster"

**Note**: Cluster creation takes 3-5 minutes.

### 3. Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username (e.g., "consenhub-user")
5. Generate a secure password (save this!)
6. Set database user privileges to "Read and write to any database"
7. Click "Add User"

### 4. Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your specific IP addresses
5. Click "Confirm"

### 5. Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as your driver
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with "consenhub"

### 6. Update ConsentHub Configuration

1. Open your `.env` file in the ConsentHub project
2. Replace the MongoDB URI:
   ```bash
   MONGODB_URI=mongodb+srv://consenhub-user:YOUR_PASSWORD@consenhub-cluster.xxxxx.mongodb.net/consenhub?retryWrites=true&w=majority
   ```

### 7. Initialize Database

Run the setup script to create collections and indexes:

```bash
# Install dependencies first
npm install

# Run Atlas setup
npm run setup:atlas
```

Or run directly:
```bash
node setup-atlas.js
```

## Connection String Format

Your MongoDB Atlas connection string should look like this:
```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

**Components:**
- `username`: Your database user username
- `password`: Your database user password
- `cluster-name.xxxxx.mongodb.net`: Your cluster's hostname
- `database-name`: "consenhub" for this project
- `retryWrites=true&w=majority`: Connection options for reliability

## Security Best Practices

### For Development:
- Use the free tier M0 cluster
- Allow access from anywhere (0.0.0.0/0) for convenience
- Use environment variables for credentials

### For Production:
- Upgrade to a dedicated cluster (M10 or higher)
- Restrict IP access to specific addresses
- Use VPC peering or private endpoints
- Enable database auditing
- Set up monitoring and alerts
- Use different credentials for different environments

## Common Issues and Solutions

### Connection Timeout
- **Issue**: Application can't connect to Atlas
- **Solution**: Check network access settings, ensure IP is whitelisted

### Authentication Failed
- **Issue**: Wrong username/password
- **Solution**: Verify credentials, check for special characters in password

### Database Not Found
- **Issue**: Database doesn't exist
- **Solution**: Run the setup script or create database manually

### Performance Issues
- **Issue**: Slow queries
- **Solution**: Check indexes, upgrade cluster tier, optimize queries

## Monitoring and Maintenance

### Atlas Dashboard
Monitor your cluster through the Atlas dashboard:
- **Metrics**: CPU, memory, network, disk usage
- **Real-time Performance**: Query performance insights
- **Alerts**: Set up custom alerts for various metrics
- **Profiler**: Identify slow queries

### Backup and Recovery
- **Automatic Backups**: Enabled by default on paid tiers
- **Point-in-time Recovery**: Restore to any point in time
- **Download Backups**: Download full backups for local storage

## Scaling Your Database

### Vertical Scaling (Cluster Tiers)
- **M0**: Free tier - 512MB storage, shared RAM
- **M10**: $57/month - 2GB RAM, 10GB storage
- **M20**: $114/month - 4GB RAM, 20GB storage
- **M30**: $193/month - 8GB RAM, 40GB storage

### Horizontal Scaling (Sharding)
- Available on M30+ clusters
- Automatic data distribution
- Improved performance and capacity

## Environment-Specific Configuration

### Development Environment
```bash
# .env.development
MONGODB_URI=mongodb+srv://dev-user:dev-password@consenhub-dev.xxxxx.mongodb.net/consenhub-dev?retryWrites=true&w=majority
```

### Staging Environment
```bash
# .env.staging
MONGODB_URI=mongodb+srv://staging-user:staging-password@consenhub-staging.xxxxx.mongodb.net/consenhub-staging?retryWrites=true&w=majority
```

### Production Environment
```bash
# .env.production
MONGODB_URI=mongodb+srv://prod-user:prod-password@consenhub-prod.xxxxx.mongodb.net/consenhub?retryWrites=true&w=majority
```

## Next Steps

1. **Set up your Atlas cluster** using the steps above
2. **Update your .env file** with the connection string
3. **Run the setup script** to initialize your database
4. **Start your ConsentHub services** and test the connection
5. **Monitor your usage** through the Atlas dashboard

## Support

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB University**: Free online courses
- **Community Forums**: https://community.mongodb.com/
- **Atlas Support**: Available through Atlas dashboard

---

**Note**: Keep your database credentials secure and never commit them to version control. Always use environment variables for sensitive configuration.
