import { useSession } from "next-auth/react"
import Button from "./Button"
import ProfileImage from "./ProfileImage"
import { type FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { api } from "~/utils/api";

function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
  if (textArea == null) return
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`
}

const NewTweetForm = () => {
  const session = useSession();
  if (session.status !== "authenticated") return null;

  return <Form/>;
}

function Form() {
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>();
  const inputRef = useCallback((textArea : HTMLTextAreaElement) => {
      updateTextAreaSize(textArea);
      textAreaRef.current = textArea;
    }, []);
  const trpsUtils = api.useContext();

  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef.current)
  }, [inputValue]);

  const createTweet = api.tweet.create.useMutation({
    onSuccess: newTweet => {
      console.log(newTweet);
      setInputValue("");

      if (session.status !== "authenticated") return
      

      trpsUtils.tweet.infiniteFeed.setInfiniteData({}, (oldData) => {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (oldData == null || oldData.pages[0] == null) return;

        const newCacheTweet = {
          ...newTweet,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data.user.id ?? null,
            name: session.data.user.name ?? null,
            image: session.data.user.image ?? null,
          },
        };

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              tweets: [newCacheTweet, ...oldData.pages[0].tweets],
            },
            ...oldData.pages.slice(1),
          ],
        } || null;
      });
    }
  });

  if (session.status !== "authenticated") return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createTweet.mutate({content: inputValue});
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4 ">
        <ProfileImage src={session.data.user.image}/>
        <textarea ref={inputRef} className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none" placeholder="What's happening?" style={{height: 0}} value={inputValue} onChange={e => setInputValue(e.target.value)}></textarea>
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  )
}


export default NewTweetForm