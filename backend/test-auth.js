const supabase = require('./config/supabase');

async function testAuth() {
    console.log("1. Testing Connection & Login...");
    // 1. Try to sign in with a test user (or fail effectively)
    // We'll use a made-up email to see if we hit Supabase at all
    const testEmail = "test_script_" + Date.now() + "@example.com";
    const testPassword = "password123";

    try {
        // Attempt Sign Up (to ensure user exists)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });

        if (signUpError) {
            console.log("   Signup failed (might be expected):", signUpError.message);
        } else {
            console.log("   Signup successful. User ID:", signUpData.user?.id);
        }

        // Attempt Sign In
        console.log("2. Attempting Sign In...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) {
            console.error("   Sign In Failed:", signInError.message);
            return;
        }

        const token = signInData.session?.access_token;
        if (!token) {
            console.error("   No token received!");
            return;
        }
        console.log("   Token received. Length:", token.length);

        // 3. Verify Token
        console.log("3. Verifying Token with getUser(token)...");
        const { data: userData, error: userError } = await supabase.auth.getUser(token);

        if (userError) {
            console.error("   Token Validation Failed:", userError.message);
        } else {
            console.log("   Token Validated Successfully! User Email:", userData.user.email);
        }

    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

testAuth();
