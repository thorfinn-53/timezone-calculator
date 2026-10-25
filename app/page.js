"use client";

import { useForm} from "react-hook-form";
import { ToastContainer, toast } from 'react-toastify';
import { Bounce } from "react-toastify";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"


export default function App() {
  const router = useRouter()
  const [availability, setavailability] = useState([{ start: "", end: "" }])
 const [timezones, settimezones] = useState([])
  const [query, setquery] = useState("")

  const filter = query === "" ? [] : timezones.filter(timezone => timezone.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const [showdropdown, setshowdropdown] = useState(false)

  





  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitted },
  } = useForm();


  const onSubmit = async (data) => {
    try {
      const response = await fetch("/api/moderators", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          name: data.Name.toLocaleLowerCase(),
          rank: data.Rank.toUpperCase().replace(/ /g, "_"),
          timezone: data.Timezone,
          availability,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not save moderator");
      }

      toast.success("Data submitted", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Bounce,
      });
      reset();
      setavailability([{ start: "", end: "" }]);
      setquery("");
    } catch (error) {
      toast.error(error.message || "Could not save moderator");
    }

  }




  const addTime = () => {
    setavailability(availability.concat({ start: "", end: "" }))
  }

  const removeTime = (index) => {
    let a = availability.filter((item, i) => i != index)
    setavailability(a)
  }

  const changeTime = (index, value, name) => {
    console.log(index, value, name)
    setavailability((initiaLavailability => {
      return initiaLavailability.map((item, i) => {
        if (i == index) {
          return { ...item, [name]: value }
        }
        else {
          return item
        }
      })
    }))
  }



  useEffect(() => {

    async function getTimezone() {
      try {
        const response = await fetch("/api/timezones");
        if (!response.ok) {
          throw new Error("Could not load timezones");
        }
        settimezones(await response.json());
      } catch (error) {
        toast.error(error.message || "Could not load timezones");
      }
    }
    getTimezone()

  }, [])


  
  




  return (
    <>
    <div className="flex justify-center">

  
    </div>
   
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">


        <div className="text-center">

          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Fill out the details
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Please fill out the information below.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="Name" className="text-sm font-semibold text-gray-700">
                Name
              </label>
              <input
                id="Name"
                type="text"
                placeholder="Name"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition duration-200 focus:outline-none focus:ring-2 ${errors.Name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                {...register("Name", {
                  required: { value: true, message: "This field is required" },
                  minLength: { value: 3, message: "Minimum length should be 3" },
                  maxLength: { value: 20, message: "Maximum length is 20" },
                  pattern: { value: /^[A-Za-z0-9 ]+$/, message: "Name should start with alphabets" }
                })}
              />
              {errors.Name && (
                <span className="text-xs font-medium text-red-500 animate-fadeIn">
                  {errors.Name.message}
                </span>
              )}
            </div>

            {/* Rank Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="Rank" className="text-sm font-semibold text-gray-700">
                Rank
              </label>
              <input
                id="Rank"
                type="text"
                placeholder="e.g. Knight"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition duration-200 focus:outline-none focus:ring-2 ${errors.Rank
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                {...register("Rank", {
                  required: { value: true, message: "This field is required" },
                  minLength: { value: 4, message: "Minimum length should be 4" },
                  maxLength: { value: 20, message: "Maximum length is 20" },
                  pattern: { value: /^[A-Za-z ]+$/, message: "Name should only contain letters" }
                })}
              />
              {errors.Rank && (
                <span className="text-xs font-medium text-red-500">
                  {errors.Rank.message}
                </span>
              )}
            </div>

            {/* Timezone Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="Timezone" className="text-sm font-semibold text-gray-700">
                Timezone
              </label>
              <input
                id="Timezone"
                type="text"
                value={query}

                placeholder="e.g. EST"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition duration-200 focus:outline-none focus:ring-2 ${errors.Timezone
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                {...register("Timezone", {
                  required: { value: true, message: "This field is required" },
                  minLength: { value: 2, message: "Minimum length should be 2" },
                  maxLength: { value: 20, message: "Maximum length is 20" },
                  onChange: (e) => { setquery(e.target.value), setshowdropdown(true) }

                })}
              />
              {errors.Timezone && (
                <span className="text-xs font-medium text-red-500">
                  {errors.Timezone.message}
                </span>
              )}
              {filter.length > 0 && showdropdown && (
                <ul className=" z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filter.map((item, index) => {
                    return (


                      <li key={index} className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer " onClick={() => { setquery(item), setshowdropdown(false), setValue("Timezone", item) }}>{item}</li>
                    )
                  })}
                </ul>
              )}


            </div>
            <label htmlFor="Availability">Availability</label>


            {availability.map((item, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex flex-col gap-3">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Slot {index + 1}
                  </span>
                  {availability.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(index)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start</label>
                    <input
                      type="time"
                      value={item.start}

                      onChange={(e) => { changeTime(index, e.target.value, "start") }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                  </div>

                  <span className="text-gray-300 pb-2.5 text-sm">→</span>

                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End</label>
                    <input
                      type="time"

                      value={item.end}
                      onChange={(e) => { changeTime(index, e.target.value, "end") }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                  </div>
                </div>

              </div>
            ))}

            <button
              type="button"
              className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-800 cursor-pointer"
              onClick={addTime}
            >
              + Add your availability
            </button>








            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-800 cursor-pointer"
               
              >
                Submit
              </button>
            </div>
          </div>
        </form>
  <button
      type="button"
      onClick={() => router.push("/Graph")}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition duration-200 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
    >
      View Graph →
    </button>
      </div>
    </div>
    
     </>
  );
}