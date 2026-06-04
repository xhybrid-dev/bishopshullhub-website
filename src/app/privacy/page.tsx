export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-headline font-bold text-primary mb-8">Privacy Statement</h1>
      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Bishops Hull Hub is committed to protecting your privacy. This statement details the steps we take to protect your personal information when you visit our website.
        </p>
        
        <h2 className="text-2xl font-bold text-primary mt-8">Information Collection</h2>
        <p>
          We may collect personal information from you such as your name, email address, and phone number when you fill out a booking enquiry form or join our community initiatives. This information is used solely for the purpose of communicating with you regarding your enquiry.
        </p>

        <h2 className="text-2xl font-bold text-primary mt-8">Data Security</h2>
        <p>
          We utilize industry-standard security measures to ensure that your data is handled securely. Our website is hosted on Firebase, providing enterprise-grade security and encryption.
        </p>

        <h2 className="text-2xl font-bold text-primary mt-8">Third-Party Disclosure</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties unless we provide you with advance notice or are required by law to do so.
        </p>

        <h2 className="text-2xl font-bold text-primary mt-8">Contact Us</h2>
        <p>
          If you have any questions about our privacy policy, please contact the trustees at <a href="mailto:trustees@bishopshullhub.co.uk" className="text-primary hover:underline">trustees@bishopshullhub.co.uk</a>.
        </p>
      </div>
    </div>
  );
}