const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

console.log('🔧 Configuring OAuth Strategies...');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✓' : 'Missing ✗');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('Facebook App ID:', process.env.FACEBOOK_APP_ID ? 'Set ✓' : 'Missing ✗');
console.log('Facebook App Secret:', process.env.FACEBOOK_APP_SECRET ? 'Set ✓' : 'Missing ✗');

// Configure Google OAuth Strategy
try {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback triggered for:', profile.emails[0].value);
          
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, send login notification
            console.log('Existing Google user found:', user.email);
            
            try {
              const { sendEmail } = require('../services/emailService');
              const { loginNotificationEmail } = require('../utils/emailTemplates');
              
              const emailTemplate = loginNotificationEmail(user.name, user.email);
              await sendEmail(
                user.email,
                emailTemplate.subject,
                'You have signed in to your CarCatALog account.',
                emailTemplate.html
              );
              console.log('✅ Login notification sent to:', user.email);
            } catch (emailError) {
              console.error('Failed to send login notification:', emailError);
            }
            
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

          if (user) {
            // Link Google account to existing user
            console.log('Linking Google account to existing user:', user.email);
            user.googleId = profile.id;
            user.isEmailVerified = true; // Google emails are verified
            await user.save();
            
            // Send notification email for linked account
            try {
              const { sendEmail } = require('../services/emailService');
              const { loginNotificationEmail } = require('../utils/emailTemplates');
              
              const emailTemplate = loginNotificationEmail(user.name, user.email);
              await sendEmail(
                user.email,
                'Google Account Linked to Your CarCatALog Account',
                'Your Google account has been linked to your CarCatALog account.',
                emailTemplate.html
              );
              console.log('✅ Account linking notification sent to:', user.email);
            } catch (emailError) {
              console.error('Failed to send linking notification:', emailError);
            }
            
            return done(null, user);
          }

          // Create new user
          console.log('Creating new user from Google:', profile.emails[0].value);
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value.toLowerCase(),
            name: profile.displayName,
            isEmailVerified: true, // Google emails are verified
            authProvider: 'google'
          });

          // Send welcome email for new Google users
          try {
            const { sendEmail } = require('../services/emailService');
            const { welcomeEmail } = require('../utils/emailTemplates');
            
            const emailTemplate = welcomeEmail(user.name, user.email);
            await sendEmail(
              user.email,
              emailTemplate.subject,
              'Welcome to CarCatALog! We are excited to have you.',
              emailTemplate.html
            );
            console.log('✅ Welcome email sent to:', user.email);
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the auth process if email fails
          }

          done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth callback:', error);
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth Strategy configured successfully');
} catch (error) {
  console.error('❌ Failed to configure Google OAuth Strategy:', error);
}

// Configure Facebook OAuth Strategy
try {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name', 'displayName']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Facebook OAuth callback triggered for:', profile.emails?.[0]?.value || profile.id);
          
          // Check if user already exists with Facebook ID
          let user = await User.findOne({ facebookId: profile.id });

          if (user) {
            // User exists, send login notification
            console.log('Existing Facebook user found:', user.email);
            
            try {
              const { sendEmail } = require('../services/emailService');
              const { loginNotificationEmail } = require('../utils/emailTemplates');
              
              const emailTemplate = loginNotificationEmail(user.name, user.email);
              await sendEmail(
                user.email,
                emailTemplate.subject,
                'You have signed in to your CarCatALog account.',
                emailTemplate.html
              );
              console.log('✅ Login notification sent to:', user.email);
            } catch (emailError) {
              console.error('Failed to send login notification:', emailError);
            }
            
            return done(null, user);
          }

          // Check if user exists with same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
              // Link Facebook account to existing user
              console.log('Linking Facebook account to existing user:', user.email);
              user.facebookId = profile.id;
              user.isEmailVerified = true; // Facebook emails are verified
              await user.save();
              
              // Send notification email for linked account
              try {
                const { sendEmail } = require('../services/emailService');
                const { loginNotificationEmail } = require('../utils/emailTemplates');
                
                const emailTemplate = loginNotificationEmail(user.name, user.email);
                await sendEmail(
                  user.email,
                  'Facebook Account Linked to Your CarCatALog Account',
                  'Your Facebook account has been linked to your CarCatALog account.',
                  emailTemplate.html
                );
                console.log('✅ Account linking notification sent to:', user.email);
              } catch (emailError) {
                console.error('Failed to send linking notification:', emailError);
              }
              
              return done(null, user);
            }
          }

          // Create new user
          const userName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Facebook User';
          console.log('Creating new user from Facebook:', email || profile.id);
          
          user = await User.create({
            facebookId: profile.id,
            email: email ? email.toLowerCase() : `facebook_${profile.id}@placeholder.com`,
            name: userName,
            isEmailVerified: !!email, // Only verified if email provided
            authProvider: 'facebook'
          });

          // Send welcome email for new Facebook users (if email available)
          if (email) {
            try {
              const { sendEmail } = require('../services/emailService');
              const { welcomeEmail } = require('../utils/emailTemplates');
              
              const emailTemplate = welcomeEmail(user.name, user.email);
              await sendEmail(
                user.email,
                emailTemplate.subject,
                'Welcome to CarCatALog! We are excited to have you.',
                emailTemplate.html
              );
              console.log('✅ Welcome email sent to:', user.email);
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
            }
          }

          done(null, user);
        } catch (error) {
          console.error('Error in Facebook OAuth callback:', error);
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Facebook OAuth Strategy configured successfully');
} catch (error) {
  console.error('❌ Failed to configure Facebook OAuth Strategy:', error);
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
