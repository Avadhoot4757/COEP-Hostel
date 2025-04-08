export default function Footer() {
    return (
      <footer className="bg-gray-900 text-gray-300 py-12 relative z-10">
        <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Contact Us</h3>
              <p>COEP Hostel</p>
              <p>College Road, Pune</p>
              <p>Maharashtra - 411005</p>
              <p className="mt-2">Phone: +91 1234567890</p>
              <p>Email: hostel@coep.ac.in</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Admission Process</a></li>
                <li><a href="#" className="hover:text-white">Fee Structure</a></li>
                <li><a href="#" className="hover:text-white">Facilities</a></li>
                <li><a href="#" className="hover:text-white">Rules & Regulations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white">Instagram</a>
                <a href="#" className="hover:text-white">Facebook</a>
                <a href="#" className="hover:text-white">Twitter</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© 2025 COEP Hostel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }