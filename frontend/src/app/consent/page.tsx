"use client";

import { useRouter } from "next/navigation";

export default function ConsentPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Informed Consent</h1>
          <p className="text-zinc-400 text-base mt-2">
            Please read the following before participating.
          </p>
        </div>

        <div className="space-y-6 text-zinc-600 text-base leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Study Title</h2>
            <p>
              The Chase: Exploring Gen Z Attitudes Toward AI Involvement in Dating and Romantic Relationships
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Purpose of the Study</h2>
            <p>
              This research study examines how young adults (ages 18-25) experience and respond to
              various levels of artificial intelligence involvement in dating and romantic
              relationships. You will be presented with a series of scenarios and asked to indicate
              your reaction using a swipe-based interface.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">What You Will Do</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide optional demographic information (age, gender, university, state)</li>
              <li>Read a series of dating-related scenarios involving AI technology</li>
              <li>Swipe right (agree/comfortable) or left (disagree/uncomfortable) on each scenario</li>
              <li>Review reflection questions at the end of the study</li>
              <li>Optionally provide contact information if you would like to discuss your responses with a researcher</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Time Commitment</h2>
            <p>
              The study takes approximately 60 minutes to complete. You may pause and resume at
              any time using the same browser.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Risks and Discomfort</h2>
            <p>
              There are no known risks beyond those encountered in everyday life. Some scenarios
              may describe dating situations that feel unfamiliar or uncomfortable. You are free
              to skip any scenario or withdraw from the study at any time without penalty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Benefits</h2>
            <p>
              There are no direct benefits to you for participating. However, your responses will
              contribute to a better understanding of how young adults perceive AI in dating,
              which may inform future technology design and policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Confidentiality</h2>
            <p>
              Your participation is anonymous. We do not collect your name or any identifying
              information unless you voluntarily provide contact details for a follow-up
              discussion. All data is stored securely and will only be used for research purposes.
              Session codes are randomly generated and cannot be traced back to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Voluntary Participation</h2>
            <p>
              Your participation in this study is entirely voluntary. You may withdraw at any
              time by simply closing your browser. There is no penalty for not completing the
              study, and any data collected up to the point of withdrawal may be used in the
              research unless you request otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Contact Information</h2>
            <p>
              If you have questions about this study, your rights as a participant, or wish to
              report a concern, please contact the research team at{" "}
              <a href="mailto:andrewakuaku@berkeley.edu" className="text-purple-600 hover:text-purple-700 underline">
                andrewakuaku@berkeley.edu
              </a>
            </p>
          </section>

          <section className="border-t border-zinc-200 pt-6">
            <p className="text-zinc-500 text-sm">
              By clicking "I Agree" below, you confirm that you have read and understood the
              information above, that you are at least 18 years of age, and that you voluntarily
              consent to participate in this study.
            </p>
          </section>
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={() => router.push("/")}
            className="btn-primary w-full max-w-xs"
          >
            I Agree
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            I do not wish to participate
          </button>
        </div>
      </div>
    </div>
  );
}
